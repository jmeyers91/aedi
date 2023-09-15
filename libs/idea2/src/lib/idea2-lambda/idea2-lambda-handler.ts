/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  LookupConstructRef,
  ClientRef,
  ResourceRef,
  ConstructRefLookupMap,
} from '../idea2-types';
import {
  AnyLambdaRef,
  LambdaDependencyGroup,
  TransformedRef,
  TransformedRefScope,
} from './idea2-lambda-types';
import type { Callback, Context, Handler } from 'aws-lambda';
import {
  getClientRefFromRef,
  resolveLambdaRuntimeEnv,
} from '../idea2-client-utils';

export const getLambdaRefHandler = (
  lambdaRef: Pick<AnyLambdaRef, 'uid' | 'context' | 'fn'>
): Handler => {
  /**
   * Used to store resolved resources at the execution-context level.
   * These cached values will be re-used between requests to the lambda.
   * Invoke scoped transform refs aren't cached to ensure they're always
   * recomputed when the lambda is invoked.
   */
  let resolvedResourceCache: Map<
    ResourceRef | ClientRef | TransformedRef<any, any>,
    any
  >;

  async function resolveDependenies(
    event: any,
    context: Context,
    callback: Callback
  ) {
    if (!resolvedResourceCache) {
      resolvedResourceCache = new Map();
    }

    const { IDEA_CONSTRUCT_UID_MAP: constructUidMap } =
      resolveLambdaRuntimeEnv();

    // Resolve dependencies concurrently
    return Object.fromEntries(
      await Promise.all(
        Object.entries(lambdaRef.context as LambdaDependencyGroup).map(
          async ([key, value]) => [
            key,
            await resolveRef(
              constructUidMap,
              value,
              resolvedResourceCache,
              event,
              context,
              callback
            ),
          ]
        )
      )
    );
  }

  return async (event, context, callback) => {
    console.log(`Lambda handler for ${lambdaRef.uid}`);
    try {
      const dependencies = await resolveDependenies(event, context, callback);
      callback(null, await lambdaRef.fn(dependencies, event, context));
    } catch (error) {
      callback(error as Error);
    }
  };
};

function resolveRef(
  constructUidMap: ConstructRefLookupMap,
  ref: ResourceRef | ClientRef | TransformedRef<any, any>,
  cache: Map<ResourceRef | ClientRef | TransformedRef<any, any>, any>,
  event: any,
  context: Context,
  callback: Callback
): any {
  if (cache.has(ref)) {
    return cache.get(ref);
  }

  if (!('transformedRef' in ref)) {
    const clientRef = getClientRefFromRef(ref);
    const resolvedRef = {
      refType: clientRef.refType,
      clientRef,
      constructRef: resolveConstructRef(constructUidMap, clientRef),
    };
    cache.set(ref, resolvedRef);
    return resolvedRef;
  }

  const resolvedRef = new Promise((resolve, reject) => {
    fn();
    async function fn() {
      try {
        const transformRef = ref as TransformedRef<any, any>;
        resolve(
          await transformRef.transform(
            await resolveRef(
              constructUidMap,
              transformRef.transformedRef,
              cache,
              event,
              context,
              callback
            ),
            event,
            context,
            callback
          )
        );
      } catch (error) {
        reject(error);
      }
    }
  });

  /**
   * Invoke scoped transform refs must be re-evaluated every time the lambda is invoked.
   * Otherwise they will be referencing stale request.
   * Static scoped transforms can
   */
  if (ref.transformedRefScope !== TransformedRefScope.INVOKE) {
    cache.set(ref, resolvedRef);
  }

  return resolvedRef;
}

function resolveConstructRef<T extends ClientRef>(
  constructUidMap: ConstructRefLookupMap,
  clientRef: T
): LookupConstructRef<T['refType']> {
  const resourceRef = clientRef.ref;
  const constructRef = constructUidMap[resourceRef.uid];
  if (!constructRef) {
    throw new Error(
      `Unable to resolve construct reference with type ${resourceRef.type} and uid ${resourceRef.uid}`
    );
  }
  return constructRef as LookupConstructRef<T['refType']>;
}

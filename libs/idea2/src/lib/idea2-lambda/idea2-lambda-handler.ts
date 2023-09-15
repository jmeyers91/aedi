/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  LookupConstructRef,
  ClientRef,
  ResourceRef,
  ConstructRefLookupMap,
} from '../idea2-types';
import type {
  AnyLambdaRef,
  LambdaDependencyGroup,
  TransformedRef,
} from './idea2-lambda-types';
import type { Handler } from 'aws-lambda';
import {
  getClientRefFromRef,
  resolveLambdaRuntimeEnv,
} from '../idea2-client-utils';

export const getLambdaRefHandler = (
  lambdaRef: Pick<AnyLambdaRef, 'uid' | 'context' | 'fn'>
): Handler => {
  let dependencies: Promise<Record<string, any>> | undefined = undefined;

  /**
   * Combines client refs with their corresponding construct ref (provided through the lambda env).
   * The wrapped context is passed to the lambda handler and is used to access dependency resources.
   * The wrapped context is lazily created to avoid execution at build-time.
   *
   * If a transformed ref is passed, the construct ref is passed into its transform function to
   * get the resolved value that is passed to the lambda.
   */
  async function bootstrapDependenies() {
    const { IDEA_CONSTRUCT_UID_MAP: constructUidMap } =
      resolveLambdaRuntimeEnv();

    // Resolve dependencies concurrently
    return Object.fromEntries(
      await Promise.all(
        Object.entries(lambdaRef.context as LambdaDependencyGroup).map(
          async ([key, value]) => [
            key,
            await resolveRef(constructUidMap, value),
          ]
        )
      )
    );
  }

  return async (event, context, callback) => {
    console.log(`Lambda handler for ${lambdaRef.uid}`);
    try {
      // Cache the promise - dependencies should only be resolved once.
      if (!dependencies) {
        dependencies = bootstrapDependenies();
      }
      callback(null, await lambdaRef.fn(await dependencies, event, context));
    } catch (error) {
      callback(error as Error);
    }
  };
};

async function resolveRef(
  constructUidMap: ConstructRefLookupMap,
  ref: ResourceRef | ClientRef | TransformedRef<any, any>
): Promise<any> {
  if (!('transformedRef' in ref)) {
    const clientRef = getClientRefFromRef(ref);
    return {
      refType: clientRef.refType,
      clientRef,
      constructRef: resolveConstructRef(constructUidMap, clientRef),
    };
  }

  return ref.transform(await resolveRef(constructUidMap, ref.transformedRef));
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

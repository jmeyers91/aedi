import type {
  LookupConstructRef,
  ClientRef,
  ResourceRef,
  ConstructRefLookupMap,
} from '../aedi-types';
import {
  AnyLambdaRef,
  EventTransformRef,
  LambdaDependencyGroup,
  ResolveRef,
  TransformedRef,
} from './aedi-lambda-types';
import type { Context, Handler } from 'aws-lambda';
import {
  getClientRefFromRef,
  resolveLambdaRuntimeEnv,
} from '../aedi-client-utils';
import { LambdaResultError } from '../aedi-resource-utils';

export const getLambdaRefHandler = (
  lambdaRef: Pick<AnyLambdaRef, 'uid' | 'context' | 'fn'>,
): Handler => {
  return async (event, context) => {
    try {
      console.log(`Lambda handler for ${lambdaRef.uid}`);
      const dependencies = await resolveDependenies(lambdaRef, event, context);

      // TODO: Allow disabling this for use-cases that involve sending text directly to lambdas without using JSON
      const eventObject =
        typeof event === 'string' ? JSON.stringify(event) : event;

      return await lambdaRef.fn(dependencies, eventObject, context);
    } catch (err) {
      console.error(err);

      // Functions can use this special error to throw an error that is returned as a specific response
      // This allows transform dependencies to throw errors other than 500 internal server errors.
      if (err instanceof LambdaResultError) {
        return err.handlerResult;
      }
      throw err;
    }
  };
};

async function resolveDependenies(
  lambdaRef: Pick<AnyLambdaRef, 'uid' | 'context' | 'fn'>,
  event: any,
  context: Context,
) {
  const { AEDI_CONSTRUCT_UID_MAP: constructUidMap } = resolveLambdaRuntimeEnv();

  // Resolve dependencies concurrently
  return Object.fromEntries(
    await Promise.all(
      Object.entries(lambdaRef.context as LambdaDependencyGroup).map(
        async ([key, value]) => [
          key,
          await resolveRef(constructUidMap, value, event, context),
        ],
      ),
    ),
  );
}

/**
 * Resolves a single lambda dependency.
 * This function is responsible for converting plain lambda ref dependency values into resolved
 * construct refs or transformed construct refs.
 * When a resource or resource client ref is passed, it is converted to its corresponding construct ref which
 * can be used to establish a connection with the construct's services.
 * When a transform ref is passed, it is evaluated recursively and the result is passed into the lambda.
 */
export async function resolveRef<
  R extends
    | ResourceRef
    | ClientRef
    | TransformedRef<any, any>
    | EventTransformRef<any, any>,
>(
  constructUidMap: ConstructRefLookupMap,
  ref: R,
  event: any,
  context: Context,
): Promise<ResolveRef<R>> {
  if ('transformEvent' in ref) {
    return ref.transformEvent(event, context);
  }

  if (!('transformedRef' in ref)) {
    const clientRef = getClientRefFromRef(ref);
    const resolvedRef = {
      refType: clientRef.refType,
      clientRef,
      constructRef: resolveConstructRef(constructUidMap, clientRef),
    };

    return resolvedRef as ResolveRef<R>;
  }

  /**
   * Recursively resolve transform refs. Invoke refs will be re-computed on each invocation of
   * the lambda, but because static refs wrap their callback in `once`, they will only be computed once.
   */
  return ref.transform(
    await resolveRef(constructUidMap, ref.transformedRef, event, context),
    event,
    context,
  );
}

/**
 * Finds a client ref's construct ref in the construct map.
 */
function resolveConstructRef<T extends ClientRef>(
  constructUidMap: ConstructRefLookupMap,
  clientRef: T,
): LookupConstructRef<T['refType']> {
  const resourceRef = clientRef.ref;
  const constructRef = constructUidMap[resourceRef.uid];
  if (!constructRef) {
    throw new Error(
      `Unable to resolve construct reference with type ${resourceRef.type} and uid ${resourceRef.uid}`,
    );
  }
  return constructRef as LookupConstructRef<T['refType']>;
}

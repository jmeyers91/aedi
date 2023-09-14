/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ConstructRefFromRefType,
  ClientRef,
  ResourceRef,
  ResolvedClientRef,
  ResourceUidMap,
} from '../idea2-types';
import type { AnyLambdaRef } from './idea2-lambda-types';
import type { Handler } from 'aws-lambda';
import {
  getClientRefFromRef,
  resolveLambdaRuntimeEnv,
} from '../idea2-client-utils';

export const getLambdaRefHandler = (
  lambdaRef: Pick<AnyLambdaRef, 'context' | 'fn'>
): Handler => {
  let wrappedContext: Record<string, ResolvedClientRef<any>> | undefined =
    undefined;

  /**
   * Combines client refs with their corresponding construct ref (provided through the lambda env).
   * The wrapped context is passed to the lambda handler and is used to access dependency resources.
   * The wrapped context is lazily created to avoid execution at build-time.
   */
  function getWrappedContext() {
    if (wrappedContext) {
      return wrappedContext;
    }
    const { IDEA_CONSTRUCT_UID_MAP: constructUidMap } =
      resolveLambdaRuntimeEnv();
    wrappedContext = {};
    for (const [key, value] of Object.entries(lambdaRef.context)) {
      // TODO: Add a sanity check to be sure `value` is a resource ref or client ref
      const clientRef = getClientRefFromRef(value as ClientRef | ResourceRef);
      wrappedContext[key] = {
        refType: clientRef.refType,
        clientRef,
        constructRef: resolveConstructRef(constructUidMap, clientRef),
      };
    }
    return wrappedContext;
  }

  return async (event, context, callback) => {
    try {
      callback(null, await lambdaRef.fn(getWrappedContext(), event, context));
    } catch (error) {
      callback(error as Error);
    }
  };
};

function resolveConstructRef<T extends ClientRef>(
  constructUidMap: ResourceUidMap,
  clientRef: T
): ConstructRefFromRefType<T['refType']> {
  const resourceRef = clientRef.ref;
  const constructRef = constructUidMap[resourceRef.uid];
  if (!constructRef) {
    throw new Error(
      `Unable to resolve construct reference with type ${resourceRef.type} and uid ${resourceRef.uid}`
    );
  }
  return constructRef as ConstructRefFromRefType<T['refType']>;
}

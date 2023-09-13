/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ConstructRefMap,
  ClientRef,
  ResourceRef,
  ResolvedClientRef,
} from '../idea2-types';
import type { AnyLambdaRef } from './idea2-lambda-types';
import type { Handler } from 'aws-lambda';
import {
  getClientRefFromRef,
  resolveLambdaRuntimeEnv,
} from '../idea2-client-utils';

export const getLambdaRefHandler = (
  lambdaRef: Omit<AnyLambdaRef, 'lambdaHandler'>
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
    const { IDEA_CONSTRUCT_REF_MAP: constructRefMap } =
      resolveLambdaRuntimeEnv();
    wrappedContext = {};
    for (const [key, value] of Object.entries(lambdaRef.context)) {
      // TODO: Add a sanity check to be sure `value` is a resource ref or client ref
      const clientRef = getClientRefFromRef(value as ClientRef | ResourceRef);
      wrappedContext[key] = {
        refType: clientRef.refType,
        clientRef,
        constructRef: resolveConstructRef(constructRefMap, clientRef),
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
  constructRefMap: Partial<ConstructRefMap>,
  clientRef: T
): ConstructRefMap[T['refType']][string] {
  const resourceRef = clientRef.ref;
  const constructRef = constructRefMap[resourceRef.type]?.[resourceRef.id];
  if (!constructRef) {
    throw new Error(
      `Unable to resolve construct reference with type ${resourceRef.type} and id ${resourceRef.id}`
    );
  }
  return constructRef as ConstructRefMap[T['refType']][string];
}

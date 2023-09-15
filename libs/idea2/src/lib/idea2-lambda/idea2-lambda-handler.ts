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
  let wrappedContext: Record<string, any> | undefined = undefined;

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
    for (const [key, value] of Object.entries(
      lambdaRef.context as LambdaDependencyGroup
    )) {
      wrappedContext[key] = resolveRef(constructUidMap, value);
    }
    return wrappedContext;
  }

  return async (event, context, callback) => {
    console.log(`Lambda handler for ${lambdaRef.uid}`);
    try {
      callback(null, await lambdaRef.fn(getWrappedContext(), event, context));
    } catch (error) {
      callback(error as Error);
    }
  };
};

function resolveRef(
  constructUidMap: ConstructRefLookupMap,
  ref: ResourceRef | ClientRef | TransformedRef<any, any>
): any {
  if (!('transformedRef' in ref)) {
    const clientRef = getClientRefFromRef(ref);
    return {
      refType: clientRef.refType,
      clientRef,
      constructRef: resolveConstructRef(constructUidMap, clientRef),
    };
  }

  return ref.transform(resolveRef(constructUidMap, ref.transformedRef));
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

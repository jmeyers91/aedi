/* eslint-disable @typescript-eslint/no-explicit-any */
import { Handler } from 'aws-lambda';
import {
  LambdaRef,
  IdeaAppHandlerEnv,
  ClientRef,
  ResourceRef,
} from './idea2-types';
import { resolveLambdaRuntimeEnv } from './idea2-env';
import { getClientRefFromRef } from './idea2-client-utils';

export const getLambdaRefHandler = (
  lambdaRef: Omit<LambdaRef<any, any>, 'lambdaHandler'>
): Handler => {
  const wrappedContext: Record<string, ClientRef> = {};
  for (const [key, value] of Object.entries(lambdaRef.context)) {
    wrappedContext[key] = getClientRefFromRef(value as ClientRef | ResourceRef);
  }

  return async (event, context, callback) => {
    try {
      const { IDEA_FUNCTION_ID: functionId }: IdeaAppHandlerEnv =
        resolveLambdaRuntimeEnv();

      if (!lambdaRef) {
        throw new Error(`Unable to resolve function: ${functionId}`);
      }

      const fnArgs =
        '__spreadArgs' in event ? (event.__spreadArgs as any[]) : [event];

      const result = await lambdaRef.fn(wrappedContext, ...fnArgs);
      callback(null, result);
    } catch (error) {
      callback(error as Error);
    }
  };
};

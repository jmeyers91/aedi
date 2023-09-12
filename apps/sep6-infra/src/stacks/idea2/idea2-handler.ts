import { Handler } from 'aws-lambda';
import { LambdaRef, IdeaAppHandlerEnv, ClientRef } from './idea2-types';
import { resolveLambdaRuntimeEnv } from './idea2-env';

export const getLambdaRefHandler = (
  lambdaRef: Omit<LambdaRef<any, any>, 'lambdaHandler'>
): Handler => {
  const wrappedContext: Record<string, ClientRef> = {};
  for (const [key, value] of Object.entries(lambdaRef.context)) {
    wrappedContext[key] = { lambda: value as LambdaRef<any, any> };
  }

  return async (event, context, callback) => {
    try {
      const {
        IDEA_FUNCTION_ID: functionId,
        IDEA_CONSTRUCT_REF_MAP: constructRefMap,
      }: IdeaAppHandlerEnv = resolveLambdaRuntimeEnv();

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

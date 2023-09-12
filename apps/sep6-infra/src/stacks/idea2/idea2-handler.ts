/* eslint-disable @typescript-eslint/no-explicit-any */
import { Handler } from 'aws-lambda';
import {
  LambdaRef,
  IdeaAppHandlerEnv,
  ClientRef,
  RefType,
  DynamoRef,
  BucketRef,
} from './idea2-types';
import { resolveLambdaRuntimeEnv } from './idea2-env';

export const getLambdaRefHandler = (
  lambdaRef: Omit<LambdaRef<any, any>, 'lambdaHandler'>
): Handler => {
  const wrappedContext: Record<string, ClientRef> = {};
  for (const [key, value] of Object.entries(lambdaRef.context)) {
    const refType = (value as any)?.type as RefType | undefined;
    if (refType === RefType.LAMBDA) {
      wrappedContext[key] = { lambda: value as LambdaRef<any, any> };
    } else if (refType === RefType.DYNAMO) {
      wrappedContext[key] = { dynamo: value as DynamoRef<any, any> };
    } else if (refType === RefType.BUCKET) {
      wrappedContext[key] = { bucket: value as BucketRef };
    }
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

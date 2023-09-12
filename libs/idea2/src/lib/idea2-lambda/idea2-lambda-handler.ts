/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClientRef, type ResourceRef } from '../idea2-types';
import type { LambdaRef } from './idea2-lambda-types';
import { Handler } from 'aws-lambda';
import { getClientRefFromRef } from '../idea2-client-utils';

export const getLambdaRefHandler = (
  lambdaRef: Omit<LambdaRef<any, any, any>, 'lambdaHandler'>
): Handler => {
  const wrappedContext: Record<string, ClientRef> = {};
  for (const [key, value] of Object.entries(lambdaRef.context)) {
    wrappedContext[key] = getClientRefFromRef(value as ClientRef | ResourceRef);
  }

  return async (event, context, callback) => {
    try {
      callback(null, await lambdaRef.fn(wrappedContext, event, context));
    } catch (error) {
      callback(error as Error);
    }
  };
};

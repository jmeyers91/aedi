import { AnyLambdaRef } from './aedi-lambda-types';
import type { Handler } from 'aws-lambda';
import { resolveComputeDependencies } from '../aedi-client-utils';
import { LambdaResultError } from '../aedi-resource-utils';

export const getLambdaRefHandler = (
  lambdaRef: Pick<AnyLambdaRef, 'uid' | 'context' | 'fn'>,
): Handler => {
  return async (event, context) => {
    try {
      console.log(`Lambda handler for ${lambdaRef.uid}`);
      const dependencies = await resolveComputeDependencies(
        lambdaRef.context,
        event,
        context,
      );

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

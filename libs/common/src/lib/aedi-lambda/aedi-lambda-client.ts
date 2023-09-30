import {
  InvokeCommand,
  LambdaClient as AwsSdkLambdaClient,
  InvokeCommandInput,
  InvokeCommandOutput,
} from '@aws-sdk/client-lambda';
import { LambdaRef, LambdaRefTypes } from './aedi-lambda-types';
import { mapRef } from '../aedi-resource-utils';

/**
 * Maps a lambda ref into a plain AWS SDK Lambda client.
 */
export function LambdaClient<R extends LambdaRef<any, any, any>>(lambdaRef: R) {
  return mapRef(lambdaRef, ({ constructRef: { region, functionName } }) => ({
    functionName,
    client: new AwsSdkLambdaClient({ region }),
  }));
}

/**
 * Maps a lambda ref into a function that can be called to invoke the remote lambda.
 */
export function LambdaInvokeClient<
  R extends LambdaRef<any, any, any>,
  const O extends Partial<InvokeCommandInput> = {},
>(lambdaRef: R, commandOverrides?: O) {
  return mapRef(LambdaClient(lambdaRef), async ({ client, functionName }) => {
    return async (
      event: LambdaRefTypes<R>['event'],
    ): Promise<
      O extends { InvocationType: 'Event' }
        ? InvokeCommandOutput
        : Awaited<LambdaRefTypes<R>['result']>
    > => {
      const invokeOptions = {
        FunctionName: functionName,
        Payload: JSON.stringify(event),
        InvocationType: 'RequestResponse',
        ...commandOverrides,
      };
      const result = await client.send(new InvokeCommand(invokeOptions));

      try {
        // Event invokactions don't wait for the invocation to complete, so no result data
        if (invokeOptions.InvocationType === 'Event') {
          return result as any;
        }
        if (!result.Payload) {
          throw new Error('Payload is undefined.');
        }
        const json = Buffer.from(result.Payload).toString('utf-8');
        return JSON.parse(json);
      } catch (error) {
        console.log('Caught', error);
        throw error;
      }
    };
  });
}

import {
  InvokeCommand,
  LambdaClient as AwsSdkLambdaClient,
} from '@aws-sdk/client-lambda';
import { LambdaRef, LambdaRefTypes } from './idea2-lambda-types';
import { mapRef } from '../idea2-resource-utils';

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
export function LambdaInvokeClient<R extends LambdaRef<any, any, any>>(
  lambdaRef: R
) {
  return mapRef(LambdaClient(lambdaRef), async ({ client, functionName }) => {
    return async (
      event: LambdaRefTypes<R>['event']
    ): Promise<Awaited<LambdaRefTypes<R>['result']>> => {
      const result = await client.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(event),
          InvocationType: 'RequestResponse',
        })
      );

      try {
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

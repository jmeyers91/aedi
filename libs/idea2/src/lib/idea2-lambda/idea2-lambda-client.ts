/* eslint-disable @typescript-eslint/no-explicit-any */
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  resolveConstructRef,
  resolveLambdaRuntimeEnv,
} from '../idea2-client-utils';
import { LambdaClientRef } from './idea2-lambda-types';

export function getCallableLambdaRef<T extends LambdaClientRef<any, any>>(
  clientRef: T
) {
  const runtimeEnv = resolveLambdaRuntimeEnv();
  const lambdaRef = clientRef.ref;
  const fnConstructRef = resolveConstructRef(clientRef);
  const { region, functionName } = fnConstructRef;
  const lambdaClient = new LambdaClient({ region });

  return async (
    event: Parameters<T['ref']['fn']>[1]
  ): Promise<Awaited<ReturnType<T['ref']['fn']>>> => {
    if (!fnConstructRef) {
      console.log('runtimeEnv', runtimeEnv);
      throw new Error(
        `Unable to find lambda ${lambdaRef.id} in construct ref map.`
      );
    }

    const result = await lambdaClient.send(
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

      return JSON.parse(Buffer.from(result.Payload).toString('utf-8'));
    } catch (error) {
      console.log('Caught', error);
      throw error;
    }
  };
}

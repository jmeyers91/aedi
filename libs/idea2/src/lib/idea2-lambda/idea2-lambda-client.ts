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
  const fnConstructRef = resolveConstructRef(clientRef);
  const { region, functionName } = fnConstructRef;
  const lambdaClient = new LambdaClient({ region });

  return async (
    event: Parameters<T['ref']['fn']>[1]
  ): Promise<Awaited<ReturnType<T['ref']['fn']>>> => {
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

export async function invoke<T extends LambdaClientRef<any, any>>(
  clientRef: T,
  event: Parameters<T['ref']['fn']>[1]
): Promise<Awaited<ReturnType<T['ref']['fn']>>> {
  return getCallableLambdaRef(clientRef)(event);
}

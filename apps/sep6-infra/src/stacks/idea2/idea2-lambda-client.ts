/* eslint-disable @typescript-eslint/no-explicit-any */
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { ClientRef } from './idea2-types';
import { resolveLambdaRuntimeEnv } from './idea2-env';

export function getCallableLambdaRef<
  T extends Extract<ClientRef, { lambda: any }>
>(lambdaClientRef: T) {
  const runtimeEnv = resolveLambdaRuntimeEnv();
  const lambdaRef = lambdaClientRef.lambda;
  const fnConstructRef =
    runtimeEnv.IDEA_CONSTRUCT_REF_MAP.functions[lambdaRef.id];
  const { region, functionName } = fnConstructRef;
  const lambdaClient = new LambdaClient({ region });

  return async (
    event: Parameters<T['lambda']['fn']>[1]
  ): Promise<Awaited<ReturnType<T['lambda']['fn']>>> => {
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

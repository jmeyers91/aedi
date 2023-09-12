/* eslint-disable @typescript-eslint/no-explicit-any */
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { ClientRef } from './idea2-types';
import { resolveLambdaRuntimeEnv } from './idea2-env';

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never;

export function getCallableLambdaRef<T extends ClientRef>(lambdaClientRef: T) {
  const lambdaClient = new LambdaClient();
  const lambdaRef = lambdaClientRef.lambda;
  const runtimeEnv = resolveLambdaRuntimeEnv();

  return async (
    ...args: Parameters<OmitFirstArg<T['lambda']['fn']>>
  ): Promise<Awaited<ReturnType<T['lambda']['fn']>>> => {
    const fnConstructRef =
      runtimeEnv.IDEA_CONSTRUCT_REF_MAP.functions[lambdaRef.id];

    if (!fnConstructRef) {
      console.log('runtimeEnv', runtimeEnv);
      throw new Error(
        `Unable to find lambda ${lambdaRef.id} in construct ref map.`
      );
    }

    const result = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: fnConstructRef.functionName,
        Payload: JSON.stringify({ __spreadArgs: args }),
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

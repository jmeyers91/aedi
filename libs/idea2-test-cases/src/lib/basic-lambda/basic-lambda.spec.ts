/* eslint-disable @typescript-eslint/no-explicit-any */
import { LambdaInvokeClient } from '@sep6/idea2';
import {
  echo as echoLambda,
  echoProxy as echoProxyLambda,
} from './basic-lambda';
import { resolveConstructRef } from '@sep6/idea2-local';

describe('basic lambda', () => {
  test('echo should return its input event', async () => {
    const echo = await resolveConstructRef(LambdaInvokeClient(echoLambda));

    expect(await echo({ message: 'hello world' })).toEqual({
      message: 'hello world',
    });
  });

  test('echoProxy should return its input event', async () => {
    const echoProxy = await resolveConstructRef(
      LambdaInvokeClient(echoProxyLambda)
    );

    expect(await echoProxy({ proxyMessage: 'hello world' })).toEqual({
      message: 'hello world',
    });
  });
});

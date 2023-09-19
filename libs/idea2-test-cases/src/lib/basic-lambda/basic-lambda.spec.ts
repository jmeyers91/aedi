/**
 * This test demonstrates calling a lambda function from another lambda function.
 */

import { LambdaInvokeClient } from '@sep6/idea2';
import { echo, echoProxy } from './basic-lambda';
import { resolveConstructRef } from '@sep6/idea2-local';

describe('basic-lambda', () => {
  test('echo should return its input event', async () => {
    const invokeEcho = await resolveConstructRef(LambdaInvokeClient(echo));

    expect(await invokeEcho({ message: 'hello world' })).toEqual({
      message: 'hello world',
    });
  });

  test('echoProxy should return its input event', async () => {
    const invokeEchoProxy = await resolveConstructRef(
      LambdaInvokeClient(echoProxy)
    );

    expect(await invokeEchoProxy({ proxyMessage: 'hello world' })).toEqual({
      message: 'hello world',
    });
  });
});

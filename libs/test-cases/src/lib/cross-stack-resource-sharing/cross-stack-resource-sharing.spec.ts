import { LambdaInvokeClient } from '@aedi/common';
import { echo, echoProxy } from './cross-stack-resource-sharing';
import { resolveConstructRef } from '@aedi/local';

describe('cross-stack-resource-sharing', () => {
  test('echo should return its input event', async () => {
    const invokeEcho = await resolveConstructRef(LambdaInvokeClient(echo));

    expect(await invokeEcho({ message: 'hello world' })).toEqual({
      message: 'hello world',
    });
  });

  test('echoProxy should return its input event', async () => {
    const invokeEchoProxy = await resolveConstructRef(
      LambdaInvokeClient(echoProxy),
    );

    expect(await invokeEchoProxy({ proxyMessage: 'hello world' })).toEqual({
      message: 'hello world',
    });
  });
});

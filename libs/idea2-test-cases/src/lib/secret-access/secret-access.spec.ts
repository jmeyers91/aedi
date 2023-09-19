import { resolveConstructRef } from '@sep6/idea2-local';
import { getSecretArn, getSecretValue } from './secret-access';
import { LambdaInvokeClient } from '@sep6/idea2';

describe('secret-access', () => {
  test('should be able to get the secret ARN', async () => {
    const invoke = await resolveConstructRef(LambdaInvokeClient(getSecretArn));

    expect(await invoke({})).toEqual('idea2-example-secret');
  });

  test('should be able to get the secret value', async () => {
    const invoke = await resolveConstructRef(
      LambdaInvokeClient(getSecretValue)
    );

    expect(await invoke({})).toEqual('Super secret!');
  });
});

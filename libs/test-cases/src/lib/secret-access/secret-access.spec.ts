import { resolveConstructRef } from '@aedi/local';
import { getSecretArn, getSecretValue } from './secret-access';
import { LambdaInvokeClient } from '@aedi/common';

describe('secret-access', () => {
  test('should be able to get the secret ARN', async () => {
    const invoke = await resolveConstructRef(LambdaInvokeClient(getSecretArn));

    expect(await invoke({})).toEqual('aedi-example-secret');
  });

  test('should be able to get the secret value', async () => {
    const invoke = await resolveConstructRef(
      LambdaInvokeClient(getSecretValue),
    );

    expect(await invoke({})).toEqual('Super secret!');
  });
});

import { getSecretArn, getSecretValue } from './secret-access';
import { resolveTestRef } from '../test-utils/load-test-construct-map';
import { LambdaInvokeClient } from '@sep6/idea2';

describe('secret-access', () => {
  test('should be able to get the secret ARN', async () => {
    const invoke = await resolveTestRef(LambdaInvokeClient(getSecretArn));

    expect(await invoke({})).toEqual('idea2-example-secret');
  });

  test('should be able to get the secret value', async () => {
    const invoke = await resolveTestRef(LambdaInvokeClient(getSecretValue));

    expect(await invoke({})).toEqual('Super secret!');
  });
});

import { LambdaInvokeClient, RefType } from '@aedi/idea2';
import { getUserPoolInfo, listUserPoolUsers } from './user-pool-client';
import { resolveConstructRef } from '@aedi/idea2-local';

describe('user-pool-client', () => {
  test('Should be able to get the user pool construct ref', async () => {
    const invoke = await resolveConstructRef(
      LambdaInvokeClient(getUserPoolInfo),
    );

    const result = await invoke({});

    expect(result).toEqual({
      clientRef: expect.any(Object),
      constructRef: {
        userPoolId: expect.any(String),
        userPoolClientId: expect.any(String),
        identityPoolId: expect.any(String),
        region: expect.any(String),
      },
      refType: RefType.USER_POOL,
    });
  });

  test('Should be able to list users in the user pool', async () => {
    const invoke = await resolveConstructRef(
      LambdaInvokeClient(listUserPoolUsers),
    );

    const result = await invoke({});

    expect(result).toEqual({
      $metadata: expect.any(Object),
      Users: [],
    });
  });
});

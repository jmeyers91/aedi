import { LambdaInvokeClient, RefType } from '@sep6/idea2';
import { resolveTestRef } from '../test-utils/load-test-construct-map';
import { getUserPoolInfo, listUserPoolUsers } from './user-pool-client';

describe('user-pool-client', () => {
  test('Should be able to get the user pool construct ref', async () => {
    const invoke = await resolveTestRef(LambdaInvokeClient(getUserPoolInfo));

    const result = await invoke({});

    expect(result).toEqual({
      clientRef: expect.any(Object),
      constructRef: {
        userPoolId: expect.any(String),
        region: expect.any(String),
      },
      refType: RefType.USER_POOL,
    });
  });

  test('Should be able to list users in the user pool', async () => {
    const invoke = await resolveTestRef(LambdaInvokeClient(listUserPoolUsers));

    const result = await invoke({});

    expect(result).toEqual({
      $metadata: expect.any(Object),
      Users: [],
    });
  });
});

import { Lambda, UserPool, UserPoolClient } from '@aedi/common';
import { Scope } from '../idea';
import { ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

const scope = Scope('user-pool-client');

const userPool = UserPool(scope, 'user-pool', {
  domainPrefix: 'idea2-test-pool-1',
  selfSignUpEnabled: false,
  signInAlias: { email: true },
});

export const getUserPoolInfo = Lambda(
  scope,
  'getUserPoolInfo',
  { userPool },
  ({ userPool }) => userPool,
);

export const listUserPoolUsers = Lambda(
  scope,
  'listUserPoolUsers',
  { userPool: UserPoolClient(userPool) },
  ({ userPool }) => {
    return userPool.client.send(
      new ListUsersCommand({
        UserPoolId: userPool.userPoolId,
      }),
    );
  },
);

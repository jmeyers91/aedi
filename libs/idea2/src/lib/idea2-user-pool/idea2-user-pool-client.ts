/* eslint-disable @typescript-eslint/no-explicit-any */
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { resolveConstructRef } from '../idea2-client-utils';
import { UserPoolClientRef } from './idea2-user-pool-types';

export function getUserPoolClient<T extends UserPoolClientRef<any, any>>(
  clientRef: T
) {
  const { userPoolId, region } = resolveConstructRef(clientRef);

  return {
    userPoolId,
    userPoolClient: new CognitoIdentityProviderClient({
      region,
    }),
  };
}

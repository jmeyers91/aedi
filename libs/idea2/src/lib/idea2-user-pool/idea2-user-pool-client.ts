/* eslint-disable @typescript-eslint/no-explicit-any */
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { UserPoolClientRef } from './idea2-user-pool-types';
import { ResolvedClientRef } from '../idea2-types';

export function getUserPoolClient<T extends UserPoolClientRef<any, any>>({
  constructRef: { userPoolId, region },
}: ResolvedClientRef<T>) {
  return {
    userPoolId,
    userPoolClient: new CognitoIdentityProviderClient({
      region,
    }),
  };
}

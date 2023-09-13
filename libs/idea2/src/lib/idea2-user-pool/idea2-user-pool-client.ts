/* eslint-disable @typescript-eslint/no-explicit-any */
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { resolveLambdaRuntimeEnv } from '../idea2-client-utils';
import { UserPoolClientRef } from './idea2-user-pool-types';

export function getUserPoolClient<T extends UserPoolClientRef<any, any>>(
  clientRef: T
) {
  const userPoolRefId = clientRef.ref.id;
  const userPoolConstructRef =
    resolveLambdaRuntimeEnv().IDEA_CONSTRUCT_REF_MAP.userPools[userPoolRefId];

  return {
    userPoolId: userPoolConstructRef.userPoolId,
    userPoolClient: new CognitoIdentityProviderClient({
      region: userPoolConstructRef.region,
    }),
  };
}

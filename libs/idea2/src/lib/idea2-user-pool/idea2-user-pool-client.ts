/* eslint-disable @typescript-eslint/no-explicit-any */
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { resolveLambdaRuntimeEnv } from '../idea2-client-utils';
import type { ClientRef } from '../idea2-types';

export function getUserPoolClient<
  T extends Extract<ClientRef, { userPool: any }>
>(bucketClientRef: T) {
  const userPoolRefId = bucketClientRef.userPool.id;
  const userPoolConstructRef =
    resolveLambdaRuntimeEnv().IDEA_CONSTRUCT_REF_MAP.userPools[userPoolRefId];

  return {
    userPoolId: userPoolConstructRef.userPoolId,
    userPoolClient: new CognitoIdentityProviderClient({
      region: userPoolConstructRef.region,
    }),
  };
}

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { UserPoolClientRef, UserPoolRef } from './aedi-user-pool-types';
import { mapRef } from '../aedi-resource-utils';

export function UserPoolClient<
  R extends UserPoolRef | UserPoolClientRef<any, any>,
>(userPoolRef: R) {
  return mapRef(userPoolRef, ({ constructRef: { userPoolId, region } }) => {
    return {
      userPoolId,
      client: new CognitoIdentityProviderClient({
        region,
      }),
    };
  });
}

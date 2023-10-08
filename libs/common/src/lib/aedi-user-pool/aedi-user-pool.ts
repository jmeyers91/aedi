import type { AuthorizerRef, UserPoolRef } from './aedi-user-pool-types';
import {
  CreateResourceOptions,
  EventTransformRef,
  RefType,
  Scope,
} from '../aedi-types';
import { createResource, mapEvent } from '../aedi-resource-utils';
import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyEventBase,
} from 'aws-lambda';

export function UserPool(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<UserPoolRef>,
): UserPoolRef {
  return createResource(RefType.USER_POOL, scope, id, options);
}

export function Authorize(
  userPool: UserPoolRef,
): AuthorizerRef &
  EventTransformRef<
    APIGatewayProxyEventBase<APIGatewayProxyCognitoAuthorizer>,
    { userId: string }
  > {
  return Object.assign(
    mapEvent(
      (event: APIGatewayProxyEventBase<APIGatewayProxyCognitoAuthorizer>) => {
        const { claims } = event.requestContext.authorizer;

        return {
          ...claims,
          userId: claims.sub as string,
        };
      },
    ),
    {
      authorizedUserPool: userPool,
    },
  );
}

import type { AuthorizerRef, UserPoolRef } from './idea2-user-pool-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource, mapEvent } from '../idea2-resource-utils';
import { EventTransformRef } from '../idea2-lambda';
import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyEventBase,
} from 'aws-lambda';

export function UserPool(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<UserPoolRef>
): UserPoolRef {
  return createResource(RefType.USER_POOL, scope, id, options);
}

export function authorize(
  userPool: UserPoolRef
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
      }
    ),
    {
      authorizedUserPool: userPool,
    }
  );
}

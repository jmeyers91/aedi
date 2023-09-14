/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayEvent } from 'aws-lambda';
import type { LambdaRef } from '../idea2-lambda/idea2-lambda-types';
import type { RestApiRef, RestApiRefRoute } from './idea2-rest-api-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export type RouteEvent = APIGatewayEvent;
export type RouteResponse<_T> = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
  __body?: _T;
};

export function restApi(
  scope: Scope,
  id: string,
  options: Omit<CreateResourceOptions<RestApiRef>, 'routes'>
): RestApiRef {
  return createResource(RefType.REST_API, scope, id, {
    ...options,
    routes: [],
  });
}

export function addRoute<
  L extends
    | LambdaRef<any, APIGatewayEvent, RouteResponse<any>>
    | LambdaRef<any, APIGatewayEvent, Promise<RouteResponse<any>>>
>(restApiRef: RestApiRef, method: string, path: string, lambdaRef: L): L {
  const route: RestApiRefRoute = {
    method,
    path,
    lambdaRef,
  };

  restApiRef.routes.push(route);

  return lambdaRef;
}

export function reply<T>(body?: T): RouteResponse<T> {
  return {
    statusCode: 200,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Origin': `*`,
    },
  };
}

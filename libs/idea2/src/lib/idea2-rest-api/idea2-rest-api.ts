/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Idea2App } from '../idea2-app';
import type { APIGatewayEvent } from 'aws-lambda';
import type { LambdaRef } from '../idea2-lambda/idea2-lambda-types';
import type { RestApiRef, RestApiRefRoute } from './idea2-rest-api-types';
import { RefType } from '../idea2-types';

export type RouteEvent = APIGatewayEvent;
export type RouteResponse<_T> = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
  __body?: _T;
};

export function restApi(
  app: Idea2App,
  id: string,
  options: Omit<RestApiRef, 'id' | 'type' | 'routes'>
): RestApiRef {
  if (app.restApis.has(id)) {
    throw new Error(`Duplicate rest-api id: ${id}`);
  }

  const restApiRef: RestApiRef = {
    ...options,
    type: RefType.REST_API,
    id,
    routes: [],
  };

  app.restApis.set(id, restApiRef);

  return restApiRef;
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

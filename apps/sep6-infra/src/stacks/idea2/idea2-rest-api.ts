/* eslint-disable @typescript-eslint/no-explicit-any */
import { RestApiRef, RefType, LambdaRef, RestApiRefRoute } from './idea2-types';
import { IdeaApp } from './idea2-app';

export function restApi(
  app: IdeaApp,
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

export function addRoute(
  restApiRef: RestApiRef,
  method: string,
  path: string,
  lambdaRef: LambdaRef<any, any>
): RestApiRefRoute {
  const route: RestApiRefRoute = {
    method,
    path,
    lambdaRef,
  };

  restApiRef.routes.push(route);

  return route;
}
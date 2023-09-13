/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LambdaRef } from '../idea2-lambda/idea2-lambda-types';
import type { RefType } from '../idea2-types';

export interface RestApiRefRoute {
  method: string;
  path: string;
  lambdaRef: LambdaRef<any, any, any>;
}

export interface RestApiRef {
  type: RefType.REST_API;
  id: string;
  routes: RestApiRefRoute[];
}

export interface RestApiClientRef {
  restApi: RestApiRef;
}
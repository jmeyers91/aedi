/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LambdaRef } from '../idea2-lambda/idea2-lambda-types';
import type { IResourceRef, RefType } from '../idea2-types';

export interface RestApiRefRoute {
  method: string;
  path: string;
  lambdaRef: LambdaRef<any, any, any>;
}

export interface RestApiRef extends IResourceRef {
  type: RefType.REST_API;
  routes: RestApiRefRoute[];
}

export interface RestApiClientRef<T extends RestApiRef, O extends object> {
  refType: RefType.REST_API;
  ref: T;
  options?: O;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RestApiConstructRef {
  url: string;
}

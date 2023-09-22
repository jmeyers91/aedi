import type { LambdaRef } from '../aedi-lambda/aedi-lambda-types';
import type { IResourceRef, IResourceTypeMap, RefType } from '../aedi-types';

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

export type RestApiRefClientOptions = object;
export type DefaultRestApiRefClientOptions = object;

export interface RestApiTypeMap extends IResourceTypeMap {
  ref: RestApiRef;
  options: RestApiRefClientOptions;
  defaultOptions: DefaultRestApiRefClientOptions;
  constructRef: RestApiConstructRef;
  clientRef: RestApiClientRef<RestApiRef, any>;
}

export type InferRestApiClient<A> = A extends { __routes?: infer R }
  ? (options: {
      baseUrl: string;
      getHeaders?(): Record<string, string> | Promise<Record<string, string>>;
    }) => {
      [K in keyof R]: InferRestApiRouteClient<R[K]>;
    }
  : never;

export type InferRestApiRouteClient<R> = R extends {
  __route?: {
    inputs: infer I;
    result: infer R;
  };
}
  ? I[keyof I] extends never
    ? () => Promise<Awaited<R>>
    : (inputs: I) => Promise<Awaited<R>>
  : never;

export type InferRequestBody<C> = Extract<
  C[keyof C],
  { __body?: any }
> extends {
  __body?: infer Q;
}
  ? Q
  : never;

export type InferRequestQueryParams<C> = Extract<
  C[keyof C],
  { __queryParams?: any }
> extends { __queryParams?: infer Q }
  ? Q
  : never;

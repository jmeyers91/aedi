import { ResourceRef } from '../aedi-types';

export interface ApiRoutePathPart {
  type: 'STRING' | 'VARIABLE';
  value: string;
}

export interface ApiBrandValue<R> {
  routes: R;
}

export interface ApiRouteBrandValue {
  path: string;
  operationName: string;
  inputs: any;
  result: any;
  lambdaContext: any;
}

export interface ApiBrand<V extends ApiBrandValue<any>> {
  __API_BRAND?: V;
}

export interface ApiRouteBrand<V extends ApiRouteBrandValue> {
  __ROUTE_BRAND?: V;
}

export type ApiRouteMap<V extends ApiRouteBrandValue> = {
  method: string;
  path: ApiRoutePathPart[];
  body?: string[];
  params?: string[];
} & ApiRouteBrand<V>;

export type InferApiMapFromResourceRef<R extends ResourceRef> =
  R extends ApiBrand<infer A>
    ? {
        [K in keyof A['routes']]: A['routes'][K] extends ApiRouteBrand<infer R>
          ? ApiRouteMap<R>
          : never;
      }
    : {};

export type ApiMap = {
  [K: string]: ApiRouteMap<any>;
};

type RemoveEmptyFnArg<T> = T extends (arg: infer I) => infer O
  ? I extends object
    ? I[keyof I] extends never
      ? () => O
      : T
    : T
  : T;

type ExtractRouteType<
  M extends ApiRouteMap<any>,
  K extends keyof ApiRouteBrandValue,
> = M extends ApiRouteBrand<infer B> ? B[K] : ApiRouteBrandValue[K];

export type ApiMapRouteClient<M extends ApiRouteMap<any>> = RemoveEmptyFnArg<
  (
    input: ExtractRouteType<M, 'inputs'>,
  ) => Promise<Awaited<ExtractRouteType<M, 'result'>>>
>;

export type ApiMapRouteRequestClient<M extends ApiRouteMap<any>> =
  RemoveEmptyFnArg<(input: ExtractRouteType<M, 'inputs'>) => Promise<Response>>;

export type ApiMapClient<M> = {
  [K in Extract<keyof M, string>]: M[K] extends ApiRouteMap<any>
    ? ApiMapRouteClient<M[K]>
    : never;
} & {
  [K in Extract<
    keyof M,
    string
  > as `${K}Request`]: M[K] extends ApiRouteMap<any>
    ? ApiMapRouteRequestClient<M[K]>
    : never;
};

export interface ApiMapClientOptions {
  baseUrl: string;
  getHeaders?(): Record<string, string> | Promise<Record<string, string>>;
}

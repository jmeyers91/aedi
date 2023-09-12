/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context, Handler } from 'aws-lambda';

export const GENERATED = Symbol('GENERATED');

export type AnyFn = (...args: any[]) => any;
export type LambdaRefFnWithEvent<C, E, R> = (
  context: WrapContext<C>,
  event: E,
  lambdaContext: Context
) => R;
export type BrandedLambdaRefFnWithEvent<C, E, R> = LambdaRefFnWithEvent<
  C,
  E,
  R
> & {
  __eventType: E;
};
export type LambdaRefFn<C> = LambdaRefFnWithEvent<C, any, any>;
export type WrapContext<C> = {
  [K in keyof C]: C[K] extends ClientRef
    ? C[K]
    : C[K] extends LambdaRef<any, any, any>
    ? { lambda: C[K] }
    : C[K] extends DynamoRef<any, any>
    ? { dynamo: C[K] }
    : C[K] extends BucketRef
    ? { bucket: C[K] }
    : C[K] extends RestApiRef
    ? { restApi: C[K] }
    : never;
};

export enum RefType {
  LAMBDA = 'lambda',
  DYNAMO = 'dynamo',
  BUCKET = 'bucket',
  REST_API = 'rest-api',
}

export type LambdaRef<C, E, R> = {
  type: RefType.LAMBDA;
  id: string;
  filepath: string;
  fn: BrandedLambdaRefFnWithEvent<C, E, R>;
  lambdaHandler: Handler;
  context: C;
};

export interface LambdaClientRef {
  lambda: LambdaRef<any, any, any>;
}

export type DynamoKey = 'BINARY' | 'NUMBER' | 'STRING';

export type DynamoRef<T, PK extends keyof T> = {
  type: RefType.DYNAMO;
  id: string;
  partitionKey: {
    name: PK;
    type: DynamoKey;
  };
  sortKey?: {
    name: keyof T;
    type: DynamoKey;
  };
};

export interface DynamoClientRef<
  T extends DynamoRef<any, any>,
  O extends DynamoRefClientOptions
> {
  dynamo: T;
  options?: O;
}

export interface DynamoRefClientOptions {
  readonly?: boolean;
}

export type BucketRef = {
  type: RefType.BUCKET;
  id: string;
  assetPath?: string;
  domain?: { domainName: string; domainZone: string } | typeof GENERATED;
};

export interface BucketClientRef {
  bucket: BucketRef;
}

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

export type ResourceRef =
  | LambdaRef<any, any, any>
  | DynamoRef<any, any>
  | BucketRef
  | RestApiRef;

export type ClientRef =
  | LambdaClientRef
  | DynamoClientRef<any, any>
  | BucketClientRef
  | RestApiClientRef;

export interface ConstructRefMap {
  functions: Record<
    string,
    {
      functionName: string;
      region: string;
    }
  >;
  tables: Record<
    string,
    {
      tableName: string;
      region: string;
    }
  >;
  buckets: Record<string, { bucketName: string; region: string }>;
}

export interface Idea2AppHandlerEnv {
  IDEA_FUNCTION_ID: string;
  IDEA_CONSTRUCT_REF_MAP: ConstructRefMap;
}

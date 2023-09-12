/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BucketClientRef,
  BucketRef,
} from './idea2-bucket/idea2-bucket-types';
import type {
  DynamoRef,
  DynamoClientRef,
} from './idea2-dynamo/idea2-dynamo-types';
import type {
  LambdaClientRef,
  LambdaRef,
} from './idea2-lambda/idea2-lambda-types';
import type {
  RestApiClientRef,
  RestApiRef,
} from './idea2-rest-api/idea2-rest-api-types';
import {
  UserPoolClientRef,
  UserPoolRef,
} from './idea2-user-pool/idea2-user-pool-types';

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
    : C[K] extends UserPoolRef
    ? { userPool: C[K] }
    : never;
};

export enum RefType {
  LAMBDA = 'lambda',
  DYNAMO = 'dynamo',
  BUCKET = 'bucket',
  REST_API = 'rest-api',
  USER_POOL = 'user-pool',
}

export type ResourceRef =
  | LambdaRef<any, any, any>
  | DynamoRef<any, any>
  | BucketRef
  | RestApiRef
  | UserPoolRef;

export type ClientRef =
  | LambdaClientRef
  | DynamoClientRef<any, any>
  | BucketClientRef
  | RestApiClientRef
  | UserPoolClientRef;

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
  userPools: Record<
    string,
    {
      userPoolId: string;
      region: string;
    }
  >;
}

export interface Idea2AppHandlerEnv {
  IDEA_FUNCTION_ID: string;
  IDEA_CONSTRUCT_REF_MAP: ConstructRefMap;
}

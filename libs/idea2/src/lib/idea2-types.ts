/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BucketClientRef,
  BucketConstructRef,
  BucketRef,
} from './idea2-bucket/idea2-bucket-types';
import type {
  DynamoClientRef,
  AnyDynamoRef,
  DynamoConstructRef,
} from './idea2-dynamo/idea2-dynamo-types';
import type {
  AnyLambdaRef,
  LambdaClientRef,
  LambdaConstructRef,
} from './idea2-lambda/idea2-lambda-types';
import type {
  RestApiClientRef,
  RestApiConstructRef,
  RestApiRef,
} from './idea2-rest-api/idea2-rest-api-types';
import {
  SecretClientRef,
  SecretConstructRef,
  SecretRef,
} from './idea2-secret/idea2-secret-types';
import {
  StaticSiteClientRef,
  StaticSiteConstructRef,
  StaticSiteRef,
} from './idea2-static-site';
import {
  UserPoolClientRef,
  UserPoolConstructRef,
  UserPoolRef,
} from './idea2-user-pool/idea2-user-pool-types';

export enum RefType {
  BUCKET = 'bucket',
  DYNAMO = 'dynamo',
  LAMBDA = 'lambda',
  REST_API = 'rest-api',
  SECRET = 'SECRET',
  STATIC_SITE = 'static-site',
  USER_POOL = 'user-pool',
}

export type ResourceRef =
  | BucketRef
  | AnyDynamoRef
  | AnyLambdaRef
  | RestApiRef
  | StaticSiteRef
  | SecretRef
  | UserPoolRef;

export type ClientRef =
  | BucketClientRef<BucketRef, any>
  | DynamoClientRef<AnyDynamoRef, any>
  | LambdaClientRef<AnyLambdaRef, any>
  | RestApiClientRef<RestApiRef, any>
  | SecretClientRef<SecretRef, any>
  | StaticSiteClientRef<StaticSiteRef, any>
  | UserPoolClientRef<UserPoolRef, any>;

// TODO: Replace this with something more generalized
// Each resource type should be able to define construct data that it expects
// This can be a map from RefType -> SpecificRefConstructType
export interface ConstructRefMap
  extends Record<RefType, Record<string, object>> {
  [RefType.BUCKET]: Record<string, BucketConstructRef>;
  [RefType.DYNAMO]: Record<string, DynamoConstructRef>;
  [RefType.LAMBDA]: Record<string, LambdaConstructRef>;
  [RefType.REST_API]: Record<string, RestApiConstructRef>;
  [RefType.SECRET]: Record<string, SecretConstructRef>;
  [RefType.STATIC_SITE]: Record<string, StaticSiteConstructRef>;
  [RefType.USER_POOL]: Record<string, UserPoolConstructRef>;
}

export type WrapContext<C> = {
  [K in keyof C]: C[K] extends ClientRef
    ? C[K]
    : C[K] extends ResourceRef
    ? { refType: C[K]['type']; ref: C[K] }
    : never;
};

export interface Idea2AppHandlerEnv {
  IDEA_FUNCTION_ID: string;
  IDEA_CONSTRUCT_REF_MAP: Partial<ConstructRefMap>;
}

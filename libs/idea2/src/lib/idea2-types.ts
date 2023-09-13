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
  LAMBDA = 'lambda',
  DYNAMO = 'dynamo',
  BUCKET = 'bucket',
  REST_API = 'rest-api',
  USER_POOL = 'user-pool',
  STATIC_SITE = 'static-site',
}

export type ResourceRef =
  | AnyLambdaRef
  | AnyDynamoRef
  | BucketRef
  | RestApiRef
  | UserPoolRef
  | StaticSiteRef;

export type ClientRef =
  | LambdaClientRef<AnyLambdaRef, any>
  | DynamoClientRef<AnyDynamoRef, any>
  | BucketClientRef<BucketRef, any>
  | RestApiClientRef<RestApiRef, any>
  | UserPoolClientRef<UserPoolRef, any>
  | StaticSiteClientRef<StaticSiteRef, any>;

// TODO: Replace this with something more generalized
// Each resource type should be able to define construct data that it expects
// This can be a map from RefType -> SpecificRefConstructType
export interface ConstructRefMap
  extends Record<RefType, Record<string, object>> {
  [RefType.BUCKET]: Record<string, BucketConstructRef>;
  [RefType.DYNAMO]: Record<string, DynamoConstructRef>;
  [RefType.LAMBDA]: Record<string, LambdaConstructRef>;
  [RefType.REST_API]: Record<string, RestApiConstructRef>;
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

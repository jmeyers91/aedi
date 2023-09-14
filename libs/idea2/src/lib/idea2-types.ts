/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BucketClientRef,
  BucketConstructRef,
  BucketRef,
} from './idea2-bucket/idea2-bucket-types';
import {
  ConstructClientRef,
  ConstructConstructRef,
  ConstructRef,
} from './idea2-construct';
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
  CONSTRUCT = 'construct',
  DYNAMO = 'dynamo',
  LAMBDA = 'lambda',
  REST_API = 'rest-api',
  SECRET = 'SECRET',
  STATIC_SITE = 'static-site',
  USER_POOL = 'user-pool',
}

export interface IIdea2App {
  isIdea2App: true;
  addResourceRef(resourceRef: IResourceRef): void;
}

export interface IResourceRef {
  uid: string;
  id: string;
  type: string;
  getScope(): Scope;
}

export type ResourceRef =
  | BucketRef
  | ConstructRef
  | AnyDynamoRef
  | AnyLambdaRef
  | RestApiRef
  | StaticSiteRef
  | SecretRef
  | UserPoolRef;

export type ClientRef =
  | BucketClientRef<BucketRef, any>
  | ConstructClientRef<ConstructRef, any>
  | DynamoClientRef<AnyDynamoRef, any>
  | LambdaClientRef<AnyLambdaRef, any>
  | RestApiClientRef<RestApiRef, any>
  | SecretClientRef<SecretRef, any>
  | StaticSiteClientRef<StaticSiteRef, any>
  | UserPoolClientRef<UserPoolRef, any>;

export interface ConstructRefLookup extends Record<RefType, object> {
  [RefType.BUCKET]: BucketConstructRef;
  [RefType.CONSTRUCT]: ConstructConstructRef;
  [RefType.DYNAMO]: DynamoConstructRef;
  [RefType.LAMBDA]: LambdaConstructRef;
  [RefType.REST_API]: RestApiConstructRef;
  [RefType.SECRET]: SecretConstructRef;
  [RefType.STATIC_SITE]: StaticSiteConstructRef;
  [RefType.USER_POOL]: UserPoolConstructRef;
}

export type ConstructRefFromRefType<R extends RefType> = ConstructRefLookup[R];

export type ResourceUidMap = Record<string, ConstructRefLookup[RefType]>;

export type ResolvedClientRef<
  C extends { refType: RefType; ref: ResourceRef }
> = {
  refType: C['refType'];
  clientRef: C;
  constructRef: ConstructRefFromRefType<C['refType']>;
};

export type WrapContext<C> = {
  [K in keyof C]: C[K] extends ClientRef
    ? ResolvedClientRef<C[K]>
    : C[K] extends ResourceRef
    ? ResolvedClientRef<{ refType: C[K]['type']; ref: C[K] }>
    : never;
};

export interface Idea2AppHandlerEnv {
  IDEA_FUNCTION_ID: string;
  IDEA_CONSTRUCT_UID_MAP: ResourceUidMap;
}

export type CreateResourceOptions<R extends IResourceRef> = Omit<
  R,
  'uid' | 'id' | 'type' | 'getScope'
>;

export type Scope = IResourceRef | IIdea2App;

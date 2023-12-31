import type { BucketTypeMap } from './aedi-bucket/aedi-bucket-types';
import type { ConstructTypeMap } from './aedi-construct';
import type { CustomResourceTypeMap } from './aedi-custom-resource';
import type { DynamoTypeMap } from './aedi-dynamo/aedi-dynamo-types';
import type { LambdaTypeMap } from './aedi-lambda/aedi-lambda-types';
import type { RestApiTypeMap } from './aedi-rest-api/aedi-rest-api-types';
import type { SecretTypeMap } from './aedi-secret/aedi-secret-types';
import type { StackTypeMap } from './aedi-stack';
import type { StaticSiteTypeMap } from './aedi-static-site';
import type { UserPoolTypeMap } from './aedi-user-pool/aedi-user-pool-types';

/**
 * All available ref types.
 */
export enum RefType {
  BUCKET = 'bucket',
  CONSTRUCT = 'construct',
  CUSTOM_RESOURCE = 'custom-resource',
  DYNAMO = 'dynamo',
  LAMBDA = 'lambda',
  REST_API = 'rest-api',
  SECRET = 'secret',
  STACK = 'stack',
  STATIC_SITE = 'static-site',
  USER_POOL = 'user-pool',
}

/**
 * The root type map for finding any type related to any resource ref.
 */
export interface ResourceRefTypeMap extends Record<RefType, IResourceTypeMap> {
  [RefType.BUCKET]: BucketTypeMap;
  [RefType.CONSTRUCT]: ConstructTypeMap;
  [RefType.CUSTOM_RESOURCE]: CustomResourceTypeMap;
  [RefType.DYNAMO]: DynamoTypeMap;
  [RefType.LAMBDA]: LambdaTypeMap;
  [RefType.REST_API]: RestApiTypeMap;
  [RefType.SECRET]: SecretTypeMap;
  [RefType.STACK]: StackTypeMap;
  [RefType.STATIC_SITE]: StaticSiteTypeMap;
  [RefType.USER_POOL]: UserPoolTypeMap;
}

/**
 * A collection of types related to a resource type.
 */
export interface IResourceTypeMap {
  ref: object;
  options: object;
  defaultOptions: object;
  constructRef: object;
  clientRef: object;
}

/**
 * Lookup any ref sub-type.
 * Example:
 * ```ts
 * // Outputs: BucketRefClientOptions
 * LookupRefType<RefType.BUCKET, 'options'>
 * ```
 */
export type LookupRefType<
  R extends RefType,
  K extends keyof ResourceRefTypeMap[RefType],
> = ResourceRefTypeMap[R][K];

/**
 * Lookup a ref type.
 * Example:
 * ```ts
 * // Outputs: BucketRef
 * LookupRef<RefType.BUCKET>
 * ```
 */
export type LookupRef<R extends RefType> = LookupRefType<R, 'ref'>;

/**
 * Lookup a ref client type.
 * Example:
 * ```ts
 * // Outputs: BucketClientRef
 * LookupClientRef<RefType.BUCKET>
 * ```
 */
export type LookupClientRef<R extends RefType> = LookupRefType<R, 'clientRef'>;

/**
 * Lookup a ref construct type.
 * Example:
 * ```ts
 * // Outputs: BucketConstructRef
 * LookupConstructRef<RefType.BUCKET>
 * ```
 */
export type LookupConstructRef<R extends RefType> = LookupRefType<
  R,
  'constructRef'
>;

/**
 * Lookup a ref client options type.
 * Example:
 * ```ts
 * // Outputs: BucketRefClientOptions
 * LookupOptions<RefType.BUCKET>
 * ```
 */
export type LookupOptions<R extends RefType> = LookupRefType<R, 'options'>;

/**
 * Lookup a ref default options type.
 * Example:
 * ```ts
 * // Outputs: DefaultBucketRefClientOptions
 * LookupDefaultOptions<RefType.BUCKET>
 * ```
 */
export type LookupDefaultOptions<R extends RefType> = LookupRefType<
  R,
  'defaultOptions'
>;

/**
 * Lookup a union of all of a specific ref sub-type.
 * Example:
 * ```ts
 * // Outputs: BucketRef | ConstructRef | DynamoRef ...
 * LookupRefTypeAll<'ref'>
 * ```
 */
export type LookupRefTypeAll<K extends keyof ResourceRefTypeMap[RefType]> =
  LookupRefType<RefType, K>;

/**
 * Any resource ref.
 */
export type ResourceRef = LookupRefTypeAll<'ref'>;

/**
 * Any resource client ref.
 */
export type ClientRef = LookupRefTypeAll<'clientRef'>;

/**
 * A client ref with additional construct ref data used by construct client libraries to
 * connect to their resources.
 */
export type ResolvedClientRef<
  C extends { refType: RefType; ref: ResourceRef },
> = {
  refType: C['refType'];
  clientRef: C;
  constructRef: LookupConstructRef<C['refType']>;
};

/**
 * The map object used by lambda functions at runtime to determine the specific connection information
 * it needs to make access one of its dependent resource clients.
 * Supplied to the lambda through a JSON environment variable. See: `AediAppHandlerEnv`
 */
export type ConstructRefLookupMap = Record<string, LookupConstructRef<RefType>>;

/**
 * These are the environment variables supplied to every aedi lambda function.
 */
export interface AediAppHandlerEnv {
  AEDI_FUNCTION_ID: string;
  AEDI_FUNCTION_UID: string;
  AEDI_CONSTRUCT_UID_MAP: ConstructRefLookupMap;
}

/**
 * The resource creation object passed to resource ref functions such as `bucket` or `dynamo`.
 */
export type CreateResourceOptions<R extends IResourceRef> = Omit<
  R,
  'uid' | 'id' | 'type' | 'getScope' | 'filepath'
>;

/**
 * Sets default values on an object type.
 */
export type OptionsWithDefaults<O, D> = Omit<D, keyof O> & O;

/**
 * An aedi resource or application.
 */
export type Scope = IResourceRef | IAediApp;

/**
 * The base interface that resources expect from the aedi app.
 */
export interface IAediApp {
  isAediApp: true;
  addResourceRef(resourceRef: IResourceRef): void;
}

/**
 * The base ref interface that all resource types extend.
 */
export interface IResourceRef {
  uid: string;
  id: string;
  type: string;
  filepath: string;
  getScope(): Scope;
}

import type { IResourceRef, IResourceTypeMap, RefType } from '../aedi-types';
import { defaultBucketRefClientOptions } from './aedi-bucket-constants';
import { TypescriptAsset } from './aedi-bucket-ts-asset';

export interface BucketRef extends IResourceRef {
  type: RefType.BUCKET;
  assetPath?: string | TypescriptAsset;
}

export interface BucketClientRef<T extends BucketRef, O extends object> {
  refType: RefType.BUCKET;
  ref: T;
  options?: O;
}

export interface BucketConstructRef {
  bucketName: string;
  region: string;
}

export interface BucketRefClientOptions {
  read?: boolean;
  write?: boolean;
  fullAccess?: boolean;
}

export type DefaultBucketRefClientOptions =
  typeof defaultBucketRefClientOptions;

export interface BucketTypeMap extends IResourceTypeMap {
  ref: BucketRef;
  options: BucketRefClientOptions;
  defaultOptions: DefaultBucketRefClientOptions;
  constructRef: BucketConstructRef;
  clientRef: BucketClientRef<BucketRef, any>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IResourceRef, IResourceTypeMap, RefType } from '../idea2-types';
import { StaticSiteRef } from '../idea2-static-site';
import { defaultBucketRefClientOptions } from './idea2-bucket-constants';

export interface BucketRef extends IResourceRef {
  type: RefType.BUCKET;
  assetPath?: string;
  staticSite?: StaticSiteRef;
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

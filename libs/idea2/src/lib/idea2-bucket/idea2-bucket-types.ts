import type { RefType } from '../idea2-types';
import { StaticSiteRef } from '../idea2-static-site';

export type BucketRef = {
  type: RefType.BUCKET;
  id: string;
  assetPath?: string;
  staticSite?: StaticSiteRef;
};

export interface BucketClientRef<T extends BucketRef, O extends object> {
  refType: RefType.BUCKET;
  ref: T;
  options?: O;
}

export interface BucketConstructRef {
  bucketName: string;
  region: string;
}

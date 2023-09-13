import type { GENERATED } from '../idea2-constants';
import type { RefType } from '../idea2-types';

export type BucketRef = {
  type: RefType.BUCKET;
  id: string;
  assetPath?: string;
  domain?: { domainName: string; domainZone: string } | typeof GENERATED;
};

export interface BucketClientRef<T extends BucketRef, O extends object> {
  refType: RefType.BUCKET;
  ref: T;
  options?: O;
}

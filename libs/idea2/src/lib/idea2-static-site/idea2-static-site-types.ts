import { BucketRef } from '../idea2-bucket';
import type { GENERATED } from '../idea2-constants';
import type { RefType } from '../idea2-types';

export type StaticSiteRef = {
  type: RefType.STATIC_SITE;
  id: string;
  bucket: BucketRef;
  domain?: { domainName: string; domainZone: string } | typeof GENERATED;
};

export interface StaticSiteClientRef<
  T extends StaticSiteRef,
  O extends object
> {
  refType: RefType.STATIC_SITE;
  ref: T;
  options?: O;
}

export interface StaticSiteConstructRef {
  url: string;
}

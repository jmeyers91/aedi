import type { GENERATED } from '../idea2-constants';
import type { IResourceRef, RefType } from '../idea2-types';

export interface StaticSiteRef extends IResourceRef {
  type: RefType.STATIC_SITE;
  domain?: { domainName: string; domainZone: string } | typeof GENERATED;
}

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

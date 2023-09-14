/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GENERATED } from '../idea2-constants';
import type { IResourceRef, IResourceTypeMap, RefType } from '../idea2-types';

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

export type StaticSiteRefClientOptions = object;
export type DefaultStaticSiteRefClientOptions = object;

export interface StaticSiteTypeMap extends IResourceTypeMap {
  ref: StaticSiteRef;
  options: StaticSiteRefClientOptions;
  defaultOptions: DefaultStaticSiteRefClientOptions;
  constructRef: StaticSiteConstructRef;
  clientRef: StaticSiteClientRef<StaticSiteRef, any>;
}

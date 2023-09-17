/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GENERATED } from '../idea2-constants';
import type { IResourceRef, IResourceTypeMap, RefType } from '../idea2-types';

export interface StaticSiteRef<C> extends IResourceRef {
  type: RefType.STATIC_SITE;
  domain?: { domainName: string; domainZone: string } | typeof GENERATED;
  assetPath: string;
  clientConfig?: C;
}

export interface StaticSiteClientRef<
  T extends StaticSiteRef<any>,
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
  ref: StaticSiteRef<any>;
  options: StaticSiteRefClientOptions;
  defaultOptions: DefaultStaticSiteRefClientOptions;
  constructRef: StaticSiteConstructRef;
  clientRef: StaticSiteClientRef<StaticSiteRef<any>, any>;
}

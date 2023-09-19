import type { GENERATED } from '../idea2-constants';
import type {
  IResourceRef,
  IResourceTypeMap,
  LookupConstructRef,
  RefType,
  ResourceRef,
} from '../idea2-types';

export interface StaticSiteRef<C> extends IResourceRef {
  type: RefType.STATIC_SITE;
  domain?: { domainName: string; domainZone: string } | typeof GENERATED;
  assetPath: string;

  /**
   * Client config will be provided to the static site and can be accessed using the idea2 browser client library.
   * Add `<script src="/client-config.js"></script>` to your site's HTML files to load the client config.
   * @default No client config is provided.
   */
  clientConfig?: C;

  /**
   * The filename to use for the client config script when deploying the app.
   * The only reason to use this option is if you're already using a file named `client-config.js` and
   * don't want it to conflict with the idea2 client config script.
   * @default "client-config.js"
   */
  clientConfigFilename?: string;
}

export type ResolveStaticSiteClientConfig<R extends StaticSiteRef<any>> =
  ResolveClientConfig<Required<R>['clientConfig']>;

export type ResolveClientConfig<C> = {
  [K in keyof C]: C[K] extends ResourceRef
    ? LookupConstructRef<C[K]['type']>
    : C[K];
};

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

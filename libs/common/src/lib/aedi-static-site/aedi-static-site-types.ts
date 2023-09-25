import type { GENERATED } from '../aedi-constants';
import { RestApiRef } from '../aedi-rest-api';
import type {
  IResourceRef,
  IResourceTypeMap,
  LookupConstructRef,
  RefType,
  ResourceRef,
} from '../aedi-types';

export interface StaticSiteRef<C> extends IResourceRef {
  type: RefType.STATIC_SITE;

  /**
   * The local path to the directory that should be uploaded as the contents of the bucket
   * during deployments.
   */
  assetPath: string;

  /**
   * The domain name and zone to use for the static site.
   * The certificate is created in us-east-1 and is verified using DNS verification.
   */
  domain?: { name: string; zone: string } | typeof GENERATED;

  /**
   * Client config will be provided to the static site and can be accessed using the aedi browser client library.
   * Add `<script src="/client-config.js"></script>` to your site's HTML files to load the client config.
   * @default No client config is provided.
   */
  clientConfig?: C;

  /**
   * The filename to use for the client config script when deploying the app.
   * The only reason to use this option is if you're already using a file named `client-config.js` and
   * don't want it to conflict with the aedi client config script.
   * @default "client-config.js"
   */
  clientConfigFilename?: string;
}

export type ResolveStaticSiteClientConfig<R extends StaticSiteRef<any>> =
  ResolveClientConfig<Required<R>['clientConfig']>;

export type ResolveClientConfig<C> = {
  [K in keyof C]: C[K] extends ResourceRef
    ? LookupConstructRef<C[K]['type']>
    : C[K] extends { behaviorRef: ResourceRef }
    ? LookupConstructRef<C[K]['behaviorRef']['type']>
    : C[K];
};

export interface StaticSiteClientRef<
  T extends StaticSiteRef<any>,
  O extends object,
> {
  refType: RefType.STATIC_SITE;
  ref: T;
  options?: O;
}

export interface StaticSiteConstructRef {
  region: string;
  bucketName: string;
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

export interface SharedTypes<T> {
  __SHARED_TYPES?: T;
}

export interface StaticSiteBehaviorOptions {
  path: string;
  viewerProtocolPolicy?: 'HTTPS_ONLY' | 'REDIRECT_TO_HTTPS' | 'ALLOW_ALL';
  cachePolicy?:
    | 'AMPLIFY'
    | 'CACHING_OPTIMIZED'
    | 'CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS'
    | 'CACHING_DISABLED'
    | 'ELEMENTAL_MEDIA_PACKAGE';
  allowedMethods?: 'ALLOW_GET_HEAD' | 'ALLOW_GET_HEAD_OPTIONS' | 'ALLOW_ALL';
  cachedMethods?: 'CACHE_GET_HEAD' | 'CACHE_GET_HEAD_OPTIONS';
  originRequestPolicy?:
    | 'USER_AGENT_REFERER_HEADERS'
    | 'CORS_CUSTOM_ORIGIN'
    | 'CORS_S3_ORIGIN'
    | 'ALL_VIEWER'
    | 'ELEMENTAL_MEDIA_TAILOR'
    | 'ALL_VIEWER_AND_CLOUDFRONT_2022'
    | 'ALL_VIEWER_EXCEPT_HOST_HEADER';
  compress?: boolean;
}

export interface StaticSiteBehavior<
  R extends ResourceRef,
  O extends StaticSiteBehaviorOptions,
> {
  behaviorRef: R;
  behaviorOptions: O;
}

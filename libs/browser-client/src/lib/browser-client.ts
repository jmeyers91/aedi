import type {
  ResolveStaticSiteClientConfig,
  StaticSiteRef,
} from '@aedi/common';

let cachedClientConfig: any;

export function resolveBrowserClient<R extends StaticSiteRef<any>>():
  | ResolveStaticSiteClientConfig<R>
  | undefined {
  if (cachedClientConfig) {
    return cachedClientConfig;
  }
  cachedClientConfig = ((globalThis ?? window) as { __clientConfig?: unknown })
    ?.__clientConfig;
  if (!cachedClientConfig) {
    return undefined;
  }
  return cachedClientConfig;
}

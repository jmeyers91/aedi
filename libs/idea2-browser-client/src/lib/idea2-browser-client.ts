import type { ResolveStaticSiteClientConfig, StaticSiteRef } from '@sep6/idea2';

let cachedClientConfig: any;

export function resolveIdea2BrowserClient<R extends StaticSiteRef<any>>():
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

import { resolveIdea2BrowserClient } from '@sep6/idea2-browser-client';
import type { staticSite } from '@sep6/idea2-test-cases';
import localDevClientConfig from '../../local-client-config.json';

export const clientConfig =
  resolveIdea2BrowserClient<typeof staticSite>() ?? getDefaultConfig();

function getDefaultConfig() {
  if (import.meta.env.MODE === 'development') {
    return localDevClientConfig;
  }
  return undefined;
}

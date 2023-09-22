import { resolveBrowserClient } from '@aedi/browser-client';
import type { staticSite } from '@aedi/test-cases';
import { getUserAuthHeaders, userPool } from '../utils/cognito-utils';

export const clientConfig = resolveBrowserClient<typeof staticSite>();

if (!clientConfig) {
  throw new Error(`Unable to load client config`);
}

export const api = clientConfig.apiClient({
  baseUrl: clientConfig.api.url,
  getHeaders() {
    return getUserAuthHeaders(userPool.getCurrentUser());
  },
});

(window as any).api = api;

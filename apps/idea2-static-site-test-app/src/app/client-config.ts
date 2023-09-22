import { resolveIdea2BrowserClient } from '@aedi/idea2-browser-client';
import type { staticSite } from '@aedi/idea2-test-cases';
import { getUserAuthHeaders, userPool } from '../utils/cognito-utils';

export const clientConfig = resolveIdea2BrowserClient<typeof staticSite>();

if (!clientConfig) {
  throw new Error(`Unable to load client config`);
}

export const api = clientConfig.apiClient({
  baseUrl: clientConfig.api.url,
  getHeaders() {
    return getUserAuthHeaders(userPool.getCurrentUser());
  },
});

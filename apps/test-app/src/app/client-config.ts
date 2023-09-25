import type { staticSite } from '@aedi/test-cases';
import {
  CollectSharedTypes,
  createBrowserApiClient,
  resolveBrowserClient,
} from '@aedi/browser-client';
import { getUserAuthHeaders, userPool } from './utils/cognito-utils';

export const clientConfig = resolveBrowserClient<typeof staticSite>();
export type ApiTypes = CollectSharedTypes<typeof clientConfig>;

export const api = createBrowserApiClient(clientConfig.apiMap, {
  getHeaders() {
    return getUserAuthHeaders(userPool.getCurrentUser());
  },
});

(window as any).api = api;

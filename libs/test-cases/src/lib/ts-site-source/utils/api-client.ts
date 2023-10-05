import { createBrowserApiClient } from '@aedi/browser-client';
import { clientConfig } from '../client-config';
import { getUserAuthHeaders, userPool } from './cognito-utils';

export const api = createBrowserApiClient(clientConfig.apiMap, {
  getHeaders() {
    return getUserAuthHeaders(userPool.getCurrentUser());
  },
});

(window as any).api = api;

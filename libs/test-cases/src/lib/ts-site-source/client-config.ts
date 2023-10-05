import type { staticSite } from './ts-site-source';
import {
  resolveBrowserClient,
  type CollectSharedTypes,
} from '@aedi/browser-client';

export const clientConfig = resolveBrowserClient<typeof staticSite>();
export type ApiTypes = CollectSharedTypes<typeof clientConfig>;

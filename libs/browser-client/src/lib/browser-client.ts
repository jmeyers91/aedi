import type {
  ResolveStaticSiteClientConfig,
  SharedTypes,
  StaticSiteRef,
} from '@aedi/common';

let cachedClientConfig: any;

export function resolveBrowserClient<
  R extends StaticSiteRef<any>,
>(): ResolveStaticSiteClientConfig<R> {
  if (cachedClientConfig) {
    return cachedClientConfig;
  }
  cachedClientConfig = ((globalThis ?? window) as { __clientConfig?: unknown })
    ?.__clientConfig;
  if (!cachedClientConfig) {
    throw new Error(`Unable to resolve browser client.`);
  }
  return cachedClientConfig;
}

export type CollectSharedTypesRaw<T> = {
  [K in keyof T]: T[K] extends SharedTypes<infer R> ? R : never;
}[keyof T];

/**
 * Gathers all the shared types available in a resolved static site browser client.
 *
 * Example:
 *
 * Static site:
 * ```ts
 * export const staticSite = StaticSite(scope, 'site', {
 *   assetPath: './dist/apps/test-app',
 *   clientConfig: {
 *     types: ShareTypes<{
 *       Counter: { counterId: string, count: number };
 *       Contact: { contactId: string, userId: string, name: string };
 *     }>(),
 *   },
 * });
 * ```
 *
 * Browser:
 *
 * ```ts
 * import type { staticSite } from '@aedi/test-cases';
 * import { LookupSharedType, resolveBrowserClient } from '@aedi/browser-client';
 *
 * export const clientConfig = resolveBrowserClient<typeof staticSite>();
 *
 * type SharedTypes = CollectSharedTypes<typeof clientConfig>;
 * type Contact = SharedTypes['Contact'];
 * ```
 *
 * In this example, `SharedTypes` resolves to:
 *
 * ```ts
 * {
 *   Counter: { counterId: string, count: number };
 *   Contact: { contactId: string, userId: string, name: string };
 * }
 * ```
 */
export type CollectSharedTypes<T> = CollectSharedTypesRaw<Extract<T, object>>;

/**
 * Used to lookup a type shared through the static site using the `ShareTypes` function.
 * Example:
 *
 * Static site:
 * ```ts
 * export const staticSite = StaticSite(scope, 'site', {
 *   assetPath: './dist/apps/test-app',
 *   clientConfig: {
 *     types: ShareTypes<{
 *       Counter: { counterId: string, count: number };
 *     }>(),
 *   },
 * });
 * ```
 *
 * Browser:
 *
 * ```ts
 * import type { staticSite } from '@aedi/test-cases';
 * import { LookupSharedType, resolveBrowserClient } from '@aedi/browser-client';
 *
 * export const clientConfig = resolveBrowserClient<typeof staticSite>();
 *
 * type Counter = LookupSharedType<typeof clientConfig, 'Counter'>; // { counterId: string, count: number }
 * ```
 */
export type LookupSharedType<
  T,
  K extends keyof CollectSharedTypes<T>,
> = CollectSharedTypes<T>[K];

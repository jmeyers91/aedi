import type {
  SharedTypes,
  StaticSiteBehavior,
  StaticSiteBehaviorOptions,
  StaticSiteRef,
} from './aedi-static-site-types';
import {
  CreateResourceOptions,
  RefType,
  ResourceRef,
  Scope,
} from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function StaticSite<C>(
  scope: Scope,
  id: string,
  { ...options }: CreateResourceOptions<StaticSiteRef<C>>,
): StaticSiteRef<C> {
  return createResource<StaticSiteRef<C>>(
    RefType.STATIC_SITE,
    scope,
    id,
    options,
  );
}

export function Behavior<
  R extends ResourceRef,
  O extends Omit<StaticSiteBehaviorOptions, 'path'> = StaticSiteBehaviorOptions,
>(
  path: string,
  ref: R,
  options: O = {} as O,
): StaticSiteBehavior<R, O & { path: string }> {
  return { behaviorRef: ref, behaviorOptions: { ...options, path } };
}

export function isBehavior(
  value: unknown,
): value is StaticSiteBehavior<ResourceRef, StaticSiteBehaviorOptions> {
  return !!(value && typeof value === 'object' && 'behaviorRef' in value);
}

/**
 * Shares types with a static site. Types shared with this function can be
 * accessed from browser clients using the `CollectSharedTypes` and `LookupSharedType` utility
 * types exported from `@aedi/browser-client`.
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
 *
 * // Alternatively, lookup a specific shared type:
 *
 * type Counter = LookupSharedType<typeof clientConfig, 'Counter'>;
 * ```
 *
 * In this example, `SharedTypes` resolves to:
 *
 * ```ts
 * type SharedTypes = {
 *   Counter: { counterId: string, count: number };
 *   Contact: { contactId: string, userId: string, name: string };
 * }
 * ```
 */
export function ShareTypes<T>(): SharedTypes<T> {
  return {};
}

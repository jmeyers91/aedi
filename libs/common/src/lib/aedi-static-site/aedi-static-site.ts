import type {
  StaticSiteApiClientGenerator,
  StaticSiteRef,
} from './aedi-static-site-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';
import { RestApiRef } from '../aedi-rest-api';

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

export function generateApiClient<R>(
  restApiRef: RestApiRef & { __routes?: R },
): StaticSiteApiClientGenerator<R> {
  return { __generateApiClient: restApiRef, restApiRef };
}

export function isStaticSiteApiClientGenerator(
  value: unknown,
): value is StaticSiteApiClientGenerator<any> {
  return !!(
    value &&
    typeof value === 'object' &&
    '__generateApiClient' in value
  );
}

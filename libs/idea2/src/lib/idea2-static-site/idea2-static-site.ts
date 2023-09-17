import type { StaticSiteRef } from './idea2-static-site-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function StaticSite<C>(
  scope: Scope,
  id: string,
  { ...options }: CreateResourceOptions<StaticSiteRef<C>>
): StaticSiteRef<C> {
  return createResource<StaticSiteRef<C>>(
    RefType.STATIC_SITE,
    scope,
    id,
    options
  );
}

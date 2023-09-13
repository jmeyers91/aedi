import type { Idea2App } from '../idea2-app';
import type { StaticSiteRef } from './idea2-static-site-types';
import { RefType } from '../idea2-types';

export function staticSite(
  app: Idea2App,
  id: string,
  options: Omit<StaticSiteRef, 'id' | 'type'>
): StaticSiteRef {
  const { bucket } = options;
  const staticSiteRef: StaticSiteRef = {
    ...options,
    type: RefType.STATIC_SITE,
    id,
  };

  if (bucket.staticSite) {
    throw new Error(
      `Bucket ${bucket.id} already has the static site ${bucket.staticSite.id} associated with it. Cannot assign additional static site: ${id}`
    );
  }

  bucket.staticSite = staticSiteRef;
  app.addResourceRef(staticSiteRef);

  return staticSiteRef;
}

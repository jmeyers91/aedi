import type { StaticSiteRef } from './idea2-static-site-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';
import { BucketRef } from '../idea2-bucket';

export function staticSite(
  scope: Scope,
  id: string,
  {
    bucket,
    ...options
  }: CreateResourceOptions<StaticSiteRef> & { bucket: BucketRef }
): StaticSiteRef {
  // Only 1 static site per bucket
  if (bucket.staticSite) {
    throw new Error(
      `Bucket ${bucket.id} already has the static site ${bucket.staticSite.id} associated with it. Cannot assign additional static site: ${id}`
    );
  }

  const staticSiteRef = createResource<StaticSiteRef>(
    RefType.STATIC_SITE,
    scope,
    id,
    options
  );

  /**
   * It's important that this relationship assignment be on the bucket because the bucket construct will resolve
   * first as it was created before this resource. This means if we put the reference on the static site, the
   * bucket construct will have already been resolved by the time the static site construct resolves.
   *
   * Additionally, putting a reference on both the bucket and static site resources causes circular reference issues.
   */
  bucket.staticSite = staticSiteRef;

  return staticSiteRef;
}

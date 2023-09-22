import type { BucketRef } from './idea2-bucket-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function Bucket(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<BucketRef> = {}
): BucketRef {
  return createResource(RefType.BUCKET, scope, id, options);
}

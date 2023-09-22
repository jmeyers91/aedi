import type { BucketRef } from './aedi-bucket-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Bucket(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<BucketRef> = {},
): BucketRef {
  return createResource(RefType.BUCKET, scope, id, options);
}

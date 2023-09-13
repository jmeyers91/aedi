import type { Idea2App } from '../idea2-app';
import type { BucketRef } from './idea2-bucket-types';
import { RefType } from '../idea2-types';

export function bucket(
  app: Idea2App,
  id: string,
  options: Omit<BucketRef, 'id' | 'type'>
): BucketRef {
  const bucketRef: BucketRef = {
    ...options,
    type: RefType.BUCKET,
    id,
  };

  app.addResourceRef(bucketRef);

  return bucketRef;
}

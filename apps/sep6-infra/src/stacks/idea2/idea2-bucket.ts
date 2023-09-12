import { BucketRef, RefType } from './idea2-types';
import { IdeaApp } from './idea2-app';

export function bucket(
  app: IdeaApp,
  id: string,
  options: Omit<BucketRef, 'id' | 'type'>
): BucketRef {
  if (app.buckets.has(id)) {
    throw new Error(`Duplicate dynamo table id: ${id}`);
  }

  const bucketRef: BucketRef = {
    ...options,
    type: RefType.BUCKET,
    id,
  };

  app.buckets.set(id, bucketRef);

  return bucketRef;
}

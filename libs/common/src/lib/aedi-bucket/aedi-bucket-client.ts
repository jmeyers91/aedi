import { S3Client } from '@aws-sdk/client-s3';
import { BucketClientRef, BucketRef } from './aedi-bucket-types';
import { mapRef } from '../aedi-resource-utils';

export function BucketClient<R extends BucketRef | BucketClientRef<any, any>>(
  bucketRef: R,
) {
  return mapRef(bucketRef, ({ constructRef: { bucketName, region } }) => {
    return { bucketName, client: new S3Client({ region }) };
  });
}

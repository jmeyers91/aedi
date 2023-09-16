/* eslint-disable @typescript-eslint/no-explicit-any */
import { S3Client } from '@aws-sdk/client-s3';
import { BucketClientRef, BucketRef } from './idea2-bucket-types';
import { ResolvedClientRef } from '../idea2-types';
import { mapRef } from '../idea2-resource-utils';

export function getBucketClient<T extends BucketClientRef<any, any>>({
  constructRef: { bucketName, region },
}: ResolvedClientRef<T>) {
  return {
    bucketName,
    s3Client: new S3Client({ region }),
  };
}

export function BucketClient(bucketRef: BucketRef) {
  return mapRef(bucketRef, ({ constructRef: { bucketName, region } }) => {
    return { bucketName, client: new S3Client({ region }) };
  });
}

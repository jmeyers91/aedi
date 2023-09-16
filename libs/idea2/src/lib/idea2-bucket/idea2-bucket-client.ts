/* eslint-disable @typescript-eslint/no-explicit-any */
import { S3Client } from '@aws-sdk/client-s3';
import { BucketClientRef, BucketRef } from './idea2-bucket-types';
import { mapRef } from '../idea2-resource-utils';

export function BucketClient<R extends BucketRef | BucketClientRef<any, any>>(
  bucketRef: R
) {
  return mapRef(bucketRef, ({ constructRef: { bucketName, region } }) => {
    return { bucketName, client: new S3Client({ region }) };
  });
}

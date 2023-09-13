/* eslint-disable @typescript-eslint/no-explicit-any */
import { S3Client } from '@aws-sdk/client-s3';
import { BucketClientRef } from './idea2-bucket-types';
import { ResolvedClientRef } from '../idea2-types';

export function getBucketClient<T extends BucketClientRef<any, any>>({
  constructRef: { bucketName, region },
}: ResolvedClientRef<T>) {
  return {
    bucketName,
    s3Client: new S3Client({ region }),
  };
}

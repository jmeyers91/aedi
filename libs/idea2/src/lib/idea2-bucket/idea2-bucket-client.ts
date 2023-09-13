/* eslint-disable @typescript-eslint/no-explicit-any */
import { S3Client } from '@aws-sdk/client-s3';
import { resolveConstructRef } from '../idea2-client-utils';
import { BucketClientRef } from './idea2-bucket-types';

export function getBucketClient<T extends BucketClientRef<any, any>>(
  clientRef: T
) {
  const { bucketName, region } = resolveConstructRef(clientRef);

  return {
    bucketName,
    s3Client: new S3Client({ region }),
  };
}

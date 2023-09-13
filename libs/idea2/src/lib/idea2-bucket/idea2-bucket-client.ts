/* eslint-disable @typescript-eslint/no-explicit-any */

import { S3Client } from '@aws-sdk/client-s3';
import { resolveLambdaRuntimeEnv } from '../idea2-client-utils';
import { BucketClientRef } from './idea2-bucket-types';

export function getBucketClient<T extends BucketClientRef<any, any>>(
  clientRef: T
) {
  const bucketRefId = clientRef.ref.id;
  const bucketConstructRef =
    resolveLambdaRuntimeEnv().IDEA_CONSTRUCT_REF_MAP.buckets[bucketRefId];

  return {
    bucketName: bucketConstructRef.bucketName,
    s3Client: new S3Client({ region: bucketConstructRef.region }),
  };
}

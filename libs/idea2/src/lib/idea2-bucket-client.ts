/* eslint-disable @typescript-eslint/no-explicit-any */

import { S3Client } from '@aws-sdk/client-s3';
import { resolveLambdaRuntimeEnv } from './idea2-env';
import { ClientRef } from './idea2-types';

export function getBucketClient<T extends Extract<ClientRef, { bucket: any }>>(
  bucketClientRef: T
) {
  const bucketRefId = bucketClientRef.bucket.id;
  const bucketConstructRef =
    resolveLambdaRuntimeEnv().IDEA_CONSTRUCT_REF_MAP.buckets[bucketRefId];

  return {
    bucketName: bucketConstructRef.bucketName,
    s3Client: new S3Client({ region: bucketConstructRef.region }),
  };
}

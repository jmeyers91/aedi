import { Bucket, BucketClient, Lambda } from '@aedi/common';
import { Scope } from '../app';
import { ListObjectsCommand } from '@aws-sdk/client-s3';

const scope = Scope('access-bucket-from-lambda');
const bucket = Bucket(scope, 'bucket', {
  // Upload the this test suite as the test files
  assetPath: __dirname,
});

export const getBucketInfo = Lambda(
  scope,
  'getBucketInfo',
  { bucket },
  ({ bucket }) => {
    return bucket;
  },
);

export const listBucket = Lambda(
  scope,
  'listBucket',
  { bucketClient: BucketClient(bucket) },
  ({ bucketClient }) => {
    return bucketClient.client.send(
      new ListObjectsCommand({
        Bucket: bucketClient.bucketName,
      }),
    );
  },
);

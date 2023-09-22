import { LambdaInvokeClient, RefType } from '@aedi/common';
import { getBucketInfo, listBucket } from './access-bucket-from-lambda';
import { resolveConstructRef } from '@aedi/local';

describe('access-bucket-from-lambda', () => {
  test('Should be able to get the S3 construct ref', async () => {
    const invoke = await resolveConstructRef(LambdaInvokeClient(getBucketInfo));

    const result = await invoke({});

    expect(result).toEqual({
      clientRef: expect.any(Object),
      constructRef: {
        bucketName: expect.any(String),
        region: expect.any(String),
      },
      refType: RefType.BUCKET,
    });
  });

  test('Should be able to list objects in the bucket', async () => {
    const invoke = await resolveConstructRef(LambdaInvokeClient(listBucket));

    const result = await invoke({});

    expect(result).toEqual({
      $metadata: expect.any(Object),
      Contents: [
        {
          ETag: expect.any(String),
          Key: 'access-bucket-from-lambda.spec.ts',
          LastModified: expect.any(String),
          Owner: expect.any(Object),
          Size: expect.any(Number),
          StorageClass: 'STANDARD',
        },
        {
          ETag: expect.any(String),
          Key: 'access-bucket-from-lambda.ts',
          LastModified: expect.any(String),
          Owner: expect.any(Object),
          Size: expect.any(Number),
          StorageClass: 'STANDARD',
        },
        {
          ETag: expect.any(String),
          Key: 'index.ts',
          LastModified: expect.any(String),
          Owner: expect.any(Object),
          Size: expect.any(Number),
          StorageClass: 'STANDARD',
        },
      ],
      IsTruncated: false,
      Marker: '',
      MaxKeys: 1000,
      Name: expect.any(String),
      Prefix: '',
    });
  });
});

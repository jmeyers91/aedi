/* eslint-disable @typescript-eslint/no-unused-vars */
import { ListObjectsCommand } from '@aws-sdk/client-s3';
import {
  getBucketClient,
  lambda,
  RouteEvent,
  addRoute,
  reply,
} from '@sep6/idea2';
import { idea } from './idea2-example-app';
import { webAppBucket, api } from './idea2-example-resources';

export const healthcheck = addRoute(
  api,
  'GET',
  '/healthcheck',
  lambda(
    idea,
    'healthcheck',
    { bucket: webAppBucket },

    async ({ bucket }, _: RouteEvent) => {
      const { bucketName, s3Client } = getBucketClient(bucket);

      const files = await s3Client.send(
        new ListObjectsCommand({
          Bucket: bucketName,
        })
      );

      return reply({ healthy: true, files });
    }
  )
);

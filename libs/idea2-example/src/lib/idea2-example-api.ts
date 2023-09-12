import { ListObjectsCommand } from '@aws-sdk/client-s3';
import {
  getBucketClient,
  lambda,
  RouteEvent,
  RouteResponse,
  addRoute,
} from '@sep6/idea2';
import { idea } from './idea2-example-app';
import { webAppBucket, api } from './idea2-example-resources';

export const healthcheck = lambda(
  idea,
  'healthcheck',
  { bucket: webAppBucket },

  async ({ bucket }, _: RouteEvent): Promise<RouteResponse> => {
    const { bucketName, s3Client } = getBucketClient(bucket);

    const files = await s3Client.send(
      new ListObjectsCommand({
        Bucket: bucketName,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ healthy: true, files }),
      headers: {
        'Access-Control-Allow-Headers':
          'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': `*`,
      },
    };
  }
);

addRoute(api, 'GET', '/healthcheck', healthcheck);

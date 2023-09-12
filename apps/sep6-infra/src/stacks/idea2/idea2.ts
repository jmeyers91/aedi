import { lambda } from './idea2-lambda';
import { IdeaApp } from './idea2-app';
import { getCallableLambdaRef } from './idea2-lambda-client';
import { readonly, table } from './idea2-dynamo';
import { getDynamoTableClient } from './idea2-dynamo-client';
import { bucket } from './idea2-bucket';
import { getBucketClient } from './idea2-bucket-client';
import { ListObjectsCommand } from '@aws-sdk/client-s3';
import { GENERATED } from './idea2-types';

export const idea = new IdeaApp();

const webAppBucket = bucket(idea, 'web-app-bucket', {
  assetPath: './dist/apps/sep6-app',
  domain: GENERATED,
});

const counterTable = table<{ counterId: string; count: number }, 'counterId'>(
  idea,
  'counter-table',
  {
    partitionKey: {
      name: 'counterId',
      type: 'STRING',
    },
  }
);

export const lambda2 = lambda(
  idea,
  'lambda2',
  { counters: counterTable, bucket: webAppBucket },
  async ({ counters, bucket }, { counterId }: { counterId: string }) => {
    try {
      const table = getDynamoTableClient(counters);
      const counter = await table.get({ counterId });
      const count = (counter?.count ?? 0) + 1;
      const { bucketName, s3Client } = getBucketClient(bucket);

      const files = await s3Client.send(
        new ListObjectsCommand({
          Bucket: bucketName,
        })
      );

      await (table as any).put({
        Item: {
          counterId,
          count,
        },
      });

      return { success: true, counterId, count, files };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        cool: 'not beans',
      };
    }
  }
);

export const lambda1 = lambda(
  idea,
  'lambda1',
  {
    fn2: lambda2,
  },
  async ({ fn2 }) => {
    try {
      const event = 'hello from lambda1';
      console.log(`Calling lambda2 with event`, event);
      const result = await getCallableLambdaRef(fn2)({ counterId: event });
      console.log(`Received result`, result);

      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

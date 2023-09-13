import { ListObjectsCommand } from '@aws-sdk/client-s3';
import {
  getBucketClient,
  getDynamoTableClient,
  lambda,
  getCallableLambdaRef,
  getSecretValue,
} from '@sep6/idea2';
import { idea } from './idea2-example-app';
import {
  counterTable,
  exampleSecret,
  webAppBucket,
} from './idea2-example-resources';

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

      await table.put({
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
      const callable = await getCallableLambdaRef(fn2);
      const result = await callable({ counterId: event });
      console.log(`Received result`, result);

      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

export const secretLambda = lambda(
  idea,
  'secretLambda',
  {
    exampleSecret,
  },
  async ({ exampleSecret }) => {
    try {
      console.log(`Getting secret`, exampleSecret.ref.id);
      const secretValue = await getSecretValue(exampleSecret);
      return { success: true, secretValue };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

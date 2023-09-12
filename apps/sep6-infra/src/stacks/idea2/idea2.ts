import { lambda } from './idea2-lambda';
import { IdeaApp } from './idea2-app';
import { getCallableLambdaRef } from './idea2-lambda-client';
import { table } from './idea2-dynamo';
import { getDynamoTableClient } from './idea2-dynamo-client';

export const idea = new IdeaApp();

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
  { counters: counterTable },
  async ({ counters }, name: string) => {
    try {
      const table = getDynamoTableClient(counters);
      const counter = await table.get({ counterId: name });
      const count = (counter?.count ?? 0) + 1;

      await table.put({
        Item: {
          counterId: name,
          count,
        },
      });

      return { success: true, name, count };
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
      const result = await getCallableLambdaRef(fn2)(event);
      console.log(`Received result`, result);

      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

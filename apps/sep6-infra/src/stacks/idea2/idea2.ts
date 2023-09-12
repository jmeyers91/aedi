import { lambda } from './idea2-lambda';
import { IdeaApp } from './idea2-app';
import { getCallableLambdaRef } from './idea2-lambda-client';

export const idea = new IdeaApp();

export const lambda2 = lambda(
  idea,
  'lambda2',
  {},
  async (context, name: string) => {
    try {
      console.log(`Received event`, name);

      return { success: true, name, cool: 'beans' };
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

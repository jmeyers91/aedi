import { getDynamoTableClient, Get, grant, Table, RestApi } from '@sep6/idea2';
import { Scope } from '../idea';

const scope = Scope('dynamo-permissions');

export const api = RestApi(scope, 'api');

const counterTable = Table<
  {
    counterId: string;
  },
  'counterId'
>(scope, 'counter-table', {
  partitionKey: {
    name: 'counterId',
    type: 'STRING',
  },
});

export const hasReadPermissionsSuccess = Get(
  api,
  'hasReadPermissionsSuccess',
  '/read-success',
  { counterTable },
  async (ctx) => {
    const table = getDynamoTableClient(ctx.counterTable);

    await table.get({ counterId: 'test' });

    return { success: true };
  }
);

export const hasWritePermissionsSuccess = Get(
  api,
  'hasWritePermissionsSuccess',
  '/write-success',
  { counterTable: grant(counterTable, { write: true }) },
  async (ctx) => {
    const table = getDynamoTableClient(ctx.counterTable);

    await table.put({ Item: { counterId: 'test' } });

    return { success: true };
  }
);

export const hasWritePermissionsFail = Get(
  api,
  'hasWritePermissionsFail',
  '/write-fail',
  { counterTable },
  async (ctx) => {
    try {
      const table = getDynamoTableClient(ctx.counterTable);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (table as any).put({ Item: { counterId: 'test' } });

      return { success: true };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: false, error: (error as any).message };
    }
  }
);

import { Grant, Table, RestApi, TableClient, GetLambda } from '@aedi/common';
import { Scope } from '../app';

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

export const hasReadPermissionsSuccess = GetLambda(
  api,
  'hasReadPermissionsSuccess',
  '/read-success',
  { table: TableClient(counterTable) },
  async ({ table }) => {
    await table.get({ counterId: 'test' });

    return { success: true };
  },
);

export const hasWritePermissionsSuccess = GetLambda(
  api,
  'hasWritePermissionsSuccess',
  '/write-success',
  { table: TableClient(Grant(counterTable, { write: true })) },
  async ({ table }) => {
    await table.put({ Item: { counterId: 'test' } });

    return { success: true };
  },
);

export const hasWritePermissionsFail = GetLambda(
  api,
  'hasWritePermissionsFail',
  '/write-fail',
  { table: TableClient(counterTable) },
  async ({ table }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      await table.put({ Item: { counterId: 'test' } });

      return { success: true };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: false, error: (error as any).message };
    }
  },
);

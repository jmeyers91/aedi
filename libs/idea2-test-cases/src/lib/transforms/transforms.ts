import { Get, RestApi, Table, TableClient, mapRef } from '@sep6/idea2';
import { Scope } from '../idea';

const scope = Scope('transforms');
export const api = RestApi(scope, 'api');

interface Counter {
  counterId: string;
  count: number;
}

const counterTable = Table<Counter, 'counterId'>(scope, 'counter-table', {
  partitionKey: {
    name: 'counterId',
    type: 'STRING',
  },
});

function provideStaticCount(counterId: string) {
  return mapRef(TableClient(counterTable), async (counterTable) => {
    const { count = 0 } = (await counterTable.get({ counterId })) ?? {};
    return count;
  });
}

export const getTestCount = Get(
  api,
  'getTestCount',
  '/test-count',
  { count: provideStaticCount('test') },
  ({ count }) => ({ count })
);

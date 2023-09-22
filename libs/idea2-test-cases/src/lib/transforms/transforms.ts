import {
  Get,
  Post,
  RestApi,
  Table,
  TableClient,
  TransformedRefScope,
  grant,
  mapRef,
} from '@aedi/idea2';
import { Scope } from '../idea';
import { randomUUID } from 'crypto';

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

function provideDynamicCount(counterId: string) {
  return mapRef(
    TableClient(counterTable),
    async (counterTable) => {
      const { count = 0 } = (await counterTable.get({ counterId })) ?? {};
      return count;
    },
    TransformedRefScope.INVOKE,
  );
}

function provideParamCount() {
  return mapRef(
    TableClient(counterTable),
    async (counterTable, event) => {
      const counterId = (event as any).pathParameters.counterId;
      const { count = 0 } = (await counterTable.get({ counterId })) ?? {};
      return count;
    },
    TransformedRefScope.INVOKE,
  );
}

const countStatic = provideStaticCount('test');
const countDynamic = provideDynamicCount('test-dynamic');
const countRequest = provideParamCount();

export const incrementCount = Post(
  api,
  'incrementCount',
  '/counter/{counterId}',
  { counterTable: TableClient(grant(counterTable, { write: true })) },
  async ({ counterTable }, event) => {
    const { counterId } = event.pathParameters;
    const counter = await counterTable.get({
      counterId,
    });
    const count = (counter?.count ?? 0) + 1;
    await counterTable.put({
      Item: { counterId, count },
    });

    return { count };
  },
);

export const getCount = Get(
  api,
  'getCount',
  '/counter/{counterId}',
  { count: countRequest },
  ({ count }) => ({ count }),
);

export const getTestCount = Get(
  api,
  'getTestCount',
  '/test-count',
  { count: countStatic },
  ({ count }) => ({ count }),
);

export const getTestCountDynamic = Get(
  api,
  'getTestCountDynamic',
  '/test-count-dynamic',
  { count: countDynamic },
  ({ count }) => ({ count }),
);

let staticInvokeCount = 0;

/**
 * These static transform checks are used to ensure static transforms are cached between executions.
 */
export const staticTransformCheck = Get(
  api,
  'staticTransformCheck',
  '/static-transform',
  {
    runCount: mapRef(counterTable, () => {
      staticInvokeCount += 1;
      return staticInvokeCount;
    }),
  },
  ({ runCount }) => {
    return { runCount, staticInvokeCount };
  },
);

export const staticTransformCheck2 = Get(
  api,
  'staticTransformCheck2',
  '/static-transform-2',
  {
    uuid: mapRef(counterTable, () => {
      return randomUUID();
    }),
  },
  ({ uuid }) => {
    return { uuid };
  },
);

export const invokeTransformCheck = Get(
  api,
  'invokeTransformCheck',
  '/invoke-transform',
  {
    uuid: mapRef(
      counterTable,
      () => {
        return randomUUID();
      },
      TransformedRefScope.INVOKE,
    ),
  },
  ({ uuid }) => {
    return { uuid };
  },
);

const rootUuid = randomUUID(); // this should be the same across all requests if they're hitting the same execution context

/**
 * Dynamic transform referencing a static transform.
 * The static transform should be cached across the execution context and the
 * dynamic transform should be repeated on each request with the cached value.
 */
const staticUuid = mapRef(counterTable, async () => {
  // Wait a second to simulate an async service startup
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `${rootUuid}___${randomUUID()}`;
});

const dynamicUuid = mapRef(
  staticUuid,
  (staticUuid) => ({ staticUuid, dynamicUuid: randomUUID() }),
  TransformedRefScope.INVOKE,
);

export const nestedTransformCheck = Get(
  api,
  'nestedTransformCheck',
  '/nested-transform',
  {
    uuid: dynamicUuid,
  },
  ({ uuid }) => ({ uuid }),
);

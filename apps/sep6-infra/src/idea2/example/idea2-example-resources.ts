import { bucket } from '../idea2-bucket';
import { table } from '../idea2-dynamo';
import { restApi } from '../idea2-rest-api';
import { GENERATED } from '../idea2-types';
import { idea } from './idea2-example-app';

export const api = restApi(idea, 'rest-api', {});

export const webAppBucket = bucket(idea, 'web-app-bucket', {
  assetPath: './dist/apps/sep6-app',
  domain: GENERATED,
});

export const counterTable = table<
  { counterId: string; count: number },
  'counterId'
>(idea, 'counter-table', {
  partitionKey: {
    name: 'counterId',
    type: 'STRING',
  },
});

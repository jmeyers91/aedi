import { bucket, table, restApi, GENERATED } from '@sep6/idea2';
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

export const constactTable = table<
  {
    userId: string;
    contactId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  },
  'userId'
>(idea, 'contact-table', {
  partitionKey: {
    name: 'userId',
    type: 'STRING',
  },
  sortKey: {
    name: 'contactId',
    type: 'STRING',
  },
});

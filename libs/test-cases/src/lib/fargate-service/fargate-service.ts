import {
  Behavior,
  Cluster,
  FargateService,
  StaticSite,
  Table,
  TableClient,
  Vpc,
} from '@aedi/common';
import fastify from 'fastify';
import { Scope } from '../app';
import { Contact, Counter } from './types';

const scope = Scope('fargate-service');
const domain = { name: 'aedi-fargate-example.smplj.xyz', zone: 'smplj.xyz' };
const vpc = Vpc(scope, 'vpc');
const cluster = Cluster(scope, 'cluster', { vpc });

const contactsTable = TableClient(
  Table<Contact, 'userId' | 'contactId'>(scope, 'contacts-table', {
    partitionKey: {
      name: 'userId',
      type: 'STRING',
    },
    sortKey: {
      name: 'contactId',
      type: 'STRING',
    },
  }),
);

const counterTable = TableClient(
  Table<Counter, 'counterId'>(scope, 'counter-table', {
    partitionKey: {
      name: 'counterId',
      type: 'STRING',
    },
  }),
);

export const counterApi = FargateService(
  scope,
  'counterApi',
  {
    port: 4200,
    cluster,
    loadBalanced: false,
    healthcheck: {
      path: '/api/healthcheck',
    },
  },
  { counterTable },
  async ({ counterTable }) => {
    console.log(`Starting fargate service: ${counterApi.uid}`);
    const port = +(process.env.PORT ?? '4200');
    const host = process.env.HOST ?? 'localhost';
    const app = fastify({ logger: true });

    app.get('/api/healthcheck', (_req, reply) => {
      console.log(`Received healthcheck request`);
      reply.status(200).send({ success: true });
    });

    app.get('/api/count/:counterId', async (req) => {
      return await counterTable.get({
        counterId: (req.params as { counterId: string }).counterId,
      });
    });

    await app.listen({ port, host });
    console.log(`Listening on port ${port}`);
  },
);

export const contactApi = FargateService(
  scope,
  'contactApi',
  {
    port: 4200,
    cluster,
    healthcheck: {
      path: '/api/healthcheck',
    },
  },
  { contactsTable, counterApi },
  async ({ contactsTable, counterApi }) => {
    console.log(`Starting fargate service: ${contactApi.uid}`);

    const port = +(process.env.PORT ?? '4200');
    const host = process.env.HOST ?? 'localhost';
    const app = fastify({ logger: true });

    app.get('/api/healthcheck', (_req, reply) => {
      console.log(`Received healthcheck request`);
      reply
        .status(200)
        .send({ success: true, counterApi: counterApi.constructRef });
    });

    app.post('/api/ping-counter-api', async () => {
      const url = `${counterApi.constructRef.url}/api/healthcheck`;
      try {
        const response = await fetch(url);
        const data = await response.text();

        return { success: true, status: response.status, data, url };
      } catch (error) {
        console.log('Caught', error);
        return { success: false, error: (error as Error).message, url };
      }
    });

    app.get('/api/contacts', async () => {
      return await contactsTable.query({
        KeyConditionExpression: `userId = :userId`,
        ExpressionAttributeValues: {
          ':userId': '1234',
        },
      });
    });

    await app.listen({ port, host });
    console.log(`Listening on port ${port}`);
  },
);

export const staticSite = StaticSite(scope, 'site', {
  domain,
  assetPath: './dist/apps/test-app',
  clientConfig: {
    api: Behavior('/api/*', contactApi),
  },
});

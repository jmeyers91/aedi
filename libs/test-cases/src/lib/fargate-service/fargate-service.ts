import {
  Behavior,
  Cluster,
  FargateService,
  Grant,
  Lambda,
  LambdaInvokeClient,
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
const mailhogDomain = { name: 'mailhog.smplj.xyz', zone: 'smplj.xyz' };
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
  Grant(
    Table<Counter, 'counterId'>(scope, 'counter-table', {
      partitionKey: {
        name: 'counterId',
        type: 'STRING',
      },
    }),
    { write: true },
  ),
);

export const mailhog = FargateService(
  scope,
  'mailhog',
  {
    cluster,
    port: 8025,
    domain: mailhogDomain,
  },
  {},
  {
    registry: 'public.ecr.aws/bowtie/mailhog:latest',
  },
);

export const counterApi = FargateService(
  scope,
  'counterApi',
  {
    port: 4200,
    cluster,
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
      const counterId = (req.params as { counterId: string }).counterId;
      const item = await counterTable.get({
        counterId,
      });

      return `Count: ${item?.count ?? 0}`;
    });

    app.post('/api/count/:counterId', async (req) => {
      const counterId = (req.params as { counterId: string }).counterId;
      const counter = await counterTable.get({
        counterId,
      });
      const count = (counter?.count ?? 0) + 1;

      await counterTable.put({ Item: { counterId, count } });

      return `Count: ${count}`;
    });

    await app.listen({ port, host });
    console.log(`Listening on port ${port}`);
  },
);

export const exampleLambda = Lambda(
  scope,
  'exampleLambda',
  {
    counterApi,
  },
  async ({ counterApi }) => {
    const url = `${counterApi.constructRef.url}/api/healthcheck`;
    try {
      const response = await fetch(url);
      const data = await response.text();

      return { success: true, status: response.status, data, url };
    } catch (error) {
      console.log('Caught', error);
      return { success: false, error: (error as Error).message, url };
    }
  },
  { vpc },
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
  {
    contactsTable,
    counterApi,
    exampleLambda: LambdaInvokeClient(exampleLambda),
    mailhog,
  },
  async ({ contactsTable, counterApi, exampleLambda }) => {
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

    app.post('/api/example-lambda', async () => {
      try {
        const result = await exampleLambda({});
        return { success: true, result };
      } catch (error) {
        console.log('Caught', error);
        return { success: false, error: (error as Error).message };
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

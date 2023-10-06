import { Behavior, FargateService, StaticSite } from '@aedi/common';
import fastify from 'fastify';
import { Scope } from '../app';

const scope = Scope('fargate-service');
const domain = { name: 'aedi-fargate-example.smplj.xyz', zone: 'smplj.xyz' };

export const api = FargateService(scope, 'api', {}, async () => {
  console.log(`Starting fargate service: ${api.uid}`);
  const port = +(process.env.PORT ?? '8080');
  const app = fastify({ logger: true });

  app.get('/api/healthcheck', (_req, reply) => {
    console.log(`Received healthcheck request`);
    reply.status(200).send({ success: true });
  });

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Listening on port ${port}`);
});

export const staticSite = StaticSite(scope, 'site', {
  domain,
  assetPath: './dist/apps/test-app',
  clientConfig: {
    api: Behavior('/api/*', api),
  },
});

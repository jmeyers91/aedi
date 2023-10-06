import { FargateService } from '@aedi/common';
import fastify from 'fastify';
import { Scope } from '../app';

const scope = Scope('fargate-service');

console.log(
  'Defining fargate service: ',
  process.env['AEDI_FARGATE_EXECUTE_SERVICE_UID'],
);

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

import { RouteEvent, lambdaRoute, lambda, reply, restApi } from '@sep6/idea2';
import { createScope } from '../idea';

const scope = createScope('healthcheck');

export const api = restApi(scope, 'api');

export const healthcheck = lambdaRoute(
  api,
  'GET',
  '/healthcheck',
  lambda(scope, 'healthcheck', {}, (_, event: RouteEvent) => {
    return reply({ testName: 'healthcheck', success: true });
  })
);

export const echo = lambdaRoute(
  api,
  'POST',
  '/echo',
  lambda(scope, 'echo', {}, (_, event: RouteEvent) => {
    return reply(JSON.parse(event.body as string));
  })
);

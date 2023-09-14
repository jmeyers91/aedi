import { RouteEvent, addRoute, lambda, reply, restApi } from '@sep6/idea2';
import { createScope } from '../../idea';

const scope = createScope('api-gateway-healthcheck');

export const api = restApi(scope, 'api');

export const healthcheck = addRoute(
  api,
  'GET',
  '/healthcheck',
  lambda(scope, 'healthcheck', {}, (_, event: RouteEvent) => {
    return reply({ testName: 'healthcheck', success: true });
  })
);

export const echo = addRoute(
  api,
  'POST',
  '/echo',
  lambda(scope, 'echo', {}, (_, event: RouteEvent) => {
    return reply(JSON.parse(event.body as string));
  })
);

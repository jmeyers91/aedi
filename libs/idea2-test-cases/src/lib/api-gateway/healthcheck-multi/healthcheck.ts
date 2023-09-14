import { addRoute, lambda, RouteEvent, reply } from '@sep6/idea2';
import { api, scope } from './shared';

export const healthcheck = addRoute(
  api,
  'GET',
  '/healthcheck',
  lambda(scope, 'healthcheck', {}, (_, event: RouteEvent) => {
    return reply({ success: true, event });
  })
);

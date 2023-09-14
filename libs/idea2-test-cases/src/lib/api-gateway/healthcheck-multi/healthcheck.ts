/* eslint-disable @typescript-eslint/no-unused-vars */
import { addRoute, lambda, RouteEvent, reply } from '@sep6/idea2';
import { api, scope } from './shared';

export const healthcheck = addRoute(
  api,
  'GET',
  '/healthcheck',
  lambda(scope, 'healthcheck', {}, (_, _event: RouteEvent) => {
    return reply({ testName: 'healthcheck-multi', success: true });
  })
);

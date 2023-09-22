/* eslint-disable @typescript-eslint/no-unused-vars */
import { Lambda, LambdaRoute, RouteEvent, reply } from '@aedi/idea2';
import { api, scope } from './shared';

export const healthcheck = LambdaRoute(
  api,
  'GET',
  '/healthcheck',
  Lambda(scope, 'healthcheck', {}, (_, _event: RouteEvent) => {
    return reply({ testName: 'healthcheck-multi', success: true });
  }),
);

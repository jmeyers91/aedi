/* eslint-disable @typescript-eslint/no-unused-vars */
import { Lambda, RestApi, RouteEvent, LambdaRoute, reply } from '@aedi/common';
import { Scope } from '../idea';

const scope = Scope('healthcheck');

export const api = RestApi(scope, 'api');

export const healthcheck = LambdaRoute(
  api,
  'GET',
  '/healthcheck',
  Lambda(scope, 'healthcheck', {}, (_, event: RouteEvent) => {
    return reply({ testName: 'healthcheck', success: true });
  }),
);

export const echo = LambdaRoute(
  api,
  'POST',
  '/echo',
  Lambda(scope, 'echo', {}, (_, event: RouteEvent) => {
    return reply(JSON.parse(event.body as string));
  }),
);

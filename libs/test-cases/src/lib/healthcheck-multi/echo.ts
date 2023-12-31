import { RouteEvent, reply, LambdaRoute, Lambda } from '@aedi/common';
import { api, scope } from './shared';

export const echo = LambdaRoute(
  api,
  'POST',
  '/echo',
  Lambda(scope, 'echo', {}, (_, event: RouteEvent) => {
    return reply(JSON.parse(event.body as string));
  }),
);

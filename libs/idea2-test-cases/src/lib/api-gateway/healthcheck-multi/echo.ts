import { RouteEvent, addRoute, lambda, reply } from '@sep6/idea2';
import { api, scope } from './shared';

export const echo = addRoute(
  api,
  'POST',
  '/echo',
  lambda(scope, 'echo', {}, (_, event: RouteEvent) => {
    return reply(JSON.parse(event.body as string));
  })
);

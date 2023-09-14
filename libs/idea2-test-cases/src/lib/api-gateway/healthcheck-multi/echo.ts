import { RouteEvent, lambdaRoute, lambda, reply } from '@sep6/idea2';
import { api, scope } from './shared';

export const echo = lambdaRoute(
  api,
  'POST',
  '/echo',
  lambda(scope, 'echo', {}, (_, event: RouteEvent) => {
    return reply(JSON.parse(event.body as string));
  })
);

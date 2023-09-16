import { Lambda, invoke } from '@sep6/idea2';
import { Scope } from '../idea';

const scope = Scope('basic-lambda');

export const echo = Lambda(scope, 'echo', {}, (_, event) =>
  JSON.stringify(event)
);

export const echoProxy = Lambda(
  scope,
  'echoProxy',
  { echo },
  ({ echo }, event) => {
    return invoke(echo, event);
  }
);

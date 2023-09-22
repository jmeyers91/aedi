import { Lambda, LambdaInvokeClient } from '@aedi/common';
import { Scope } from '../idea';

const scope = Scope('basic-lambda');

export const echo = Lambda(
  scope,
  'echo',
  {},
  (_, { message }: { message: string }) => ({ message }),
);

export const echoProxy = Lambda(
  scope,
  'echoProxy',
  { echo: LambdaInvokeClient(echo) },
  ({ echo }, { proxyMessage }: { proxyMessage: string }) =>
    echo({ message: proxyMessage }),
);

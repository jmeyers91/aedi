/**
 * This test case demonstrates connecting resources deployed to separate stacks.
 */

import { Lambda, LambdaInvokeClient } from '@aedi/common';
import { Scope } from '../app';

const scope1 = Scope('cross-stack-resource-sharing-1');
const scope2 = Scope('cross-stack-resource-sharing-2');

export const echo = Lambda(
  scope1,
  'echo',
  {},
  (_, { message }: { message: string }) => ({ message }),
);

export const echoProxy = Lambda(
  scope2,
  'echoProxy',
  { echo: LambdaInvokeClient(echo) },
  ({ echo }, { proxyMessage }: { proxyMessage: string }) =>
    echo({ message: proxyMessage }),
);

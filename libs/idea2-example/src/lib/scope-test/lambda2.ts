import { construct, lambda } from '@sep6/idea2';
import { idea } from '../idea2-example-app';

export const scopedLambda = lambda(
  construct(idea, 'lambda-scope-2'),
  'scopedLambda',
  {},
  () => `Hello from scoped lambda 2`
);

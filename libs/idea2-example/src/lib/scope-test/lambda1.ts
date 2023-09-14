import { construct, invoke, lambda } from '@sep6/idea2';
import { idea } from '../idea2-example-app';
import { scopedLambda as otherScopedLambda } from './lambda2';

export const scopedLambda = lambda(
  construct(idea, 'lambda-scope-1'),
  'scopedLambda',
  { otherScopedLambda },
  async (ctx) =>
    `Hello from scoped lambda 1. Invoking lambda 2: ${await invoke(
      ctx.otherScopedLambda,
      {}
    )}`
);

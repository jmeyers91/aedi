/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context, Handler } from 'aws-lambda';
import type { RefType, WrapContext } from '../idea2-types';

export type AnyFn = (...args: any[]) => any;
export type LambdaRefFnWithEvent<C, E, R> = (
  context: WrapContext<C>,
  event: E,
  lambdaContext: Context
) => R;
export type BrandedLambdaRefFnWithEvent<C, E, R> = LambdaRefFnWithEvent<
  C,
  E,
  R
> & {
  __eventType: E;
};
export type LambdaRefFn<C> = LambdaRefFnWithEvent<C, any, any>;

export type LambdaRef<C, E, R> = {
  type: RefType.LAMBDA;
  id: string;
  filepath: string;
  fn: BrandedLambdaRefFnWithEvent<C, E, R>;
  lambdaHandler: Handler;
  context: C;
};

export interface LambdaClientRef {
  lambda: LambdaRef<any, any, any>;
}
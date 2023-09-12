/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Handler } from 'aws-lambda';

export type AnyFn = (...args: any[]) => any;
export type LambdaRefFn<C> = (context: WrapContext<C>, ...args: any[]) => any;

export type LambdaRef<C, Fn extends LambdaRefFn<C>> = {
  id: string;
  filepath: string;
  fn: Fn;
  lambdaHandler: Handler;
  context: C;
};

export type ClientRef = {
  lambda: LambdaRef<any, any>;
};

export type WrapContext<C> = {
  [K in keyof C]: C[K] extends LambdaRef<any, any> ? { lambda: C[K] } : never;
};

export interface ConstructRefMap {
  functions: Record<
    string,
    {
      functionName: string;
    }
  >;
}

export interface IdeaAppHandlerEnv {
  IDEA_FUNCTION_ID: string;
  IDEA_CONSTRUCT_REF_MAP: ConstructRefMap;
}

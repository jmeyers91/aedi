/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context, Handler } from 'aws-lambda';
import type {
  ClientRef,
  IResourceRef,
  IResourceTypeMap,
  RefType,
  ResolvedClientRef,
  ResourceRef,
} from '../idea2-types';

export type AnyFn = (...args: any[]) => any;
export type LambdaRefFnWithEvent<C, E, R> = (
  context: WrapContext<C>,
  event: E,
  lambdaContext: Context
) => R;

/**
 * Adds the construct ref data to the dependency object supplied when defining a lambda function.
 * This additional data is what is needed by construct client libraries to connect to their resources.
 */
export type WrapContext<C> = {
  [K in keyof C]: C[K] extends ClientRef
    ? ResolvedClientRef<C[K]>
    : C[K] extends ResourceRef
    ? ResolvedClientRef<{ refType: C[K]['type']; ref: C[K] }>
    : never;
};

export type BrandedLambdaRefFnWithEvent<C, E, R> = LambdaRefFnWithEvent<
  C,
  E,
  R
> & {
  __eventType?: E;
};
export type LambdaRefFn<C> = LambdaRefFnWithEvent<C, any, any>;

export interface LambdaRef<C, E, R> extends IResourceRef {
  type: RefType.LAMBDA;
  filepath: string;
  fn: BrandedLambdaRefFnWithEvent<C, E, R>;
  lambdaHandler: Handler;
  context: C;
}

export type AnyLambdaRef = LambdaRef<any, any, any>;

export interface LambdaClientRef<
  T extends LambdaRef<any, any, any>,
  O extends object
> {
  refType: RefType.LAMBDA;
  ref: T;
  options?: O;
}

export interface LambdaConstructRef {
  functionName: string;
  region: string;
}

export type LambdaRefClientOptions = object;
export type DefaultLambdaRefClientOptions = object;

export interface LambdaTypeMap extends IResourceTypeMap {
  ref: AnyLambdaRef;
  options: LambdaRefClientOptions;
  defaultOptions: DefaultLambdaRefClientOptions;
  constructRef: LambdaConstructRef;
  clientRef: LambdaClientRef<AnyLambdaRef, any>;
}

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
export type LambdaRefFnWithEvent<C extends LambdaDependencyGroup, E, R> = (
  context: WrapContext<C>,
  event: E,
  lambdaContext: Context
) => R;

export type TransformedRef<
  R extends ResourceRef | ClientRef | TransformedRef<any, any>,
  C
> = {
  transformedRef: R;
  transform(ref: ResolveRef<R>): C;
};

export type UnwrapTransformedRef<T> = T extends TransformedRef<infer R, infer C>
  ? { ref: R; result: C; input: ResolveRef<R> }
  : unknown;

export type LambdaDependencyGroup = Record<
  string,
  ResourceRef | ClientRef | TransformedRef<any, any>
>;

export type ResolveSimpleRef<R> = R extends ClientRef
  ? ResolvedClientRef<R>
  : R extends ResourceRef
  ? ResolvedClientRef<{ refType: R['type']; ref: R }>
  : R;

export type ResolveRef<R> = R extends TransformedRef<any, infer C>
  ? Awaited<C>
  : ResolveSimpleRef<R>;

/**
 * Adds the construct ref data to the dependency object supplied when defining a lambda function.
 * This additional data is what is needed by construct client libraries to connect to their resources.
 */
export type WrapContext<C> = {
  [K in keyof C]: ResolveRef<C[K]>;
};

export type BrandedLambdaRefFnWithEvent<
  C extends LambdaDependencyGroup,
  E,
  R
> = LambdaRefFnWithEvent<C, E, R> & {
  __eventType?: E;
};
export type LambdaRefFn<C extends LambdaDependencyGroup> = LambdaRefFnWithEvent<
  C,
  any,
  any
>;

export interface LambdaHandlerLocation {
  filepath: string;
  exportKey: string;
}

export interface LambdaRef<C extends LambdaDependencyGroup, E, R>
  extends IResourceRef {
  type: RefType.LAMBDA;
  handlerLocation?: LambdaHandlerLocation;
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

import type { Context, Handler } from 'aws-lambda';
import type {
  ComputeDependencyGroup,
  IResourceRef,
  IResourceTypeMap,
  RefType,
  WrapContext,
} from '../aedi-types';
import { VpcRef } from '../aedi-vpc';

export type LambdaRefFnWithEvent<C extends LambdaDependencyGroup, E, R> = (
  context: WrapContext<C>,
  event: E,
  lambdaContext: Context,
) => R;

export type LambdaDependencyGroup = ComputeDependencyGroup;

export type BrandedLambdaRefFnWithEvent<
  C extends LambdaDependencyGroup,
  E,
  R,
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
  vpc?: VpcRef;
  memorySize?: number;
  timeout?: number;
}

export type LambdaRefOptions = Pick<
  AnyLambdaRef,
  'memorySize' | 'timeout' | 'vpc'
>;

export type LambdaRefTypes<T> = T extends LambdaRef<infer C, infer E, infer R>
  ? {
      context: C;
      event: E;
      result: R;
    }
  : never;

export type AnyLambdaRef = LambdaRef<any, any, any>;

export interface LambdaClientRef<
  T extends LambdaRef<any, any, any>,
  O extends object,
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

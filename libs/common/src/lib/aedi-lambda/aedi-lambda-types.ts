import type { Context, Handler } from 'aws-lambda';
import type {
  ClientRef,
  IResourceRef,
  IResourceTypeMap,
  RefType,
  ResolvedClientRef,
  ResourceRef,
} from '../aedi-types';

export type AnyFn = (...args: any[]) => any;
export type LambdaRefFnWithEvent<C extends LambdaDependencyGroup, E, R> = (
  context: WrapContext<C>,
  event: E,
  lambdaContext: Context,
) => R;

export enum TransformedRefScope {
  STATIC = 'STATIC',
  INVOKE = 'INVOKE',
}

export type TransformedRef<
  R extends ResourceRef | ClientRef | TransformedRef<any, any>,
  C,
> =
  | {
      transformedRefScope: TransformedRefScope.STATIC;
      transformedRef: R;
      transform(ref: ResolveRef<R>): C;
    }
  | {
      transformedRefScope: TransformedRefScope.INVOKE;
      transformedRef: R;
      transform(ref: ResolveRef<R>, event: any, context: Context): C;
    };

export type EventTransformRef<E, C> = {
  transformEvent(event: E, context: Context): C;
};

export type UnwrapTransformedRef<T> = T extends TransformedRef<infer R, infer C>
  ? { ref: R; result: C; input: ResolveRef<R> }
  : unknown;

export type LambdaDependencyGroup = Record<
  string,
  | ResourceRef
  | ClientRef
  | TransformedRef<any, any>
  | EventTransformRef<any, any>
>;

export type ResolveSimpleRef<R> = R extends ClientRef
  ? ResolvedClientRef<R>
  : R extends ResourceRef
  ? ResolvedClientRef<{ refType: R['type']; ref: R }>
  : R;

export type ResolveRef<R> = R extends TransformedRef<any, infer C>
  ? Awaited<C>
  : R extends EventTransformRef<any, infer C>
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
  memorySize?: number;
  timeout?: number;
}

export type LambdaRefOptions = Pick<AnyLambdaRef, 'memorySize' | 'timeout'>;

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

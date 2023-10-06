import type {
  ClientRef,
  IResourceRef,
  IResourceTypeMap,
  RefType,
  ResourceRef,
} from '../aedi-types';
import { TransformedRef, WrapContext } from '../aedi-lambda';

export type FargateServiceDependencyGroup = Record<
  string,
  ResourceRef | ClientRef | TransformedRef<any, any>
>;

export type FargateServiceRefFn<C extends FargateServiceDependencyGroup> = (
  context: WrapContext<C>,
) => any;

export interface FargateServiceHandlerLocation {
  filepath: string;
  exportKey: string;
}

export interface FargateServiceRef<C extends FargateServiceDependencyGroup>
  extends IResourceRef {
  type: RefType.FARGATE_SERVICE;
  handlerLocation?: FargateServiceHandlerLocation;
  fn: FargateServiceRefFn<C>;
  context: C;
}

export type FargateServiceRefTypes<T> = T extends FargateServiceRef<infer C>
  ? {
      context: C;
    }
  : never;

export type AnyFargateServiceRef = FargateServiceRef<any>;

export interface FargateServiceClientRef<
  T extends AnyFargateServiceRef,
  O extends object,
> {
  refType: RefType.FARGATE_SERVICE;
  ref: T;
  options?: O;
}

export interface FargateServiceConstructRef {
  region: string;
}

export type FargateServiceRefClientOptions = object;
export type DefaultFargateServiceRefClientOptions = object;

export interface FargateServiceTypeMap extends IResourceTypeMap {
  ref: AnyFargateServiceRef;
  options: FargateServiceRefClientOptions;
  defaultOptions: DefaultFargateServiceRefClientOptions;
  constructRef: FargateServiceConstructRef;
  clientRef: FargateServiceClientRef<AnyFargateServiceRef, any>;
}

import { ClusterRef } from '../aedi-cluster';
import type {
  ClientRef,
  IResourceRef,
  IResourceTypeMap,
  RefType,
  ResourceRef,
  StaticTransformedRef,
  WrapContext,
} from '../aedi-types';

export type FargateServiceDependencyGroup = Record<
  string,
  ResourceRef | ClientRef | StaticTransformedRef<any, any>
>;

export type FargateServiceRefFn<C extends FargateServiceDependencyGroup> = (
  context: WrapContext<C>,
) => any;

export type FargateServiceImage<C extends FargateServiceDependencyGroup> =
  | FargateServiceRefFn<C>
  | { registry: string; environment?: Record<string, string> };

export interface FargateServiceHandlerLocation {
  filepath: string;
  exportKey: string;
}

export interface FargateServiceRef<C extends FargateServiceDependencyGroup>
  extends IResourceRef {
  type: RefType.FARGATE_SERVICE;
  handlerLocation?: FargateServiceHandlerLocation;
  handler?: () => Promise<unknown>;
  loadBalanced?: boolean;
  image: FargateServiceImage<C>;
  context: C;
  port: number;
  cluster: ClusterRef;
  healthcheck?: {
    path?: string;
    command?: string;
  };
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
  url: string;
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

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
  image: FargateServiceImage<C>;
  context: C;
  port: number;
  cluster: ClusterRef;
  cpu?: number;
  memoryLimitMiB?: number;
  domain?: { name: string; zone: string };
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

/**
 * ECS only support specific combinations of CPU and memory. This type represents those combinations.
 */
export type FargateServiceHardwareRequirementPair =
  | {
      cpu?: 256;
      memoryLimitMiB?: 512 | 1024 | 2048;
    }
  | {
      cpu: 512;
      memoryLimitMiB: 1024 | 2048 | 3072 | 4096;
    }
  | {
      cpu: 1024;
      memoryLimitMiB: 2048 | 3072 | 4096 | 5120 | 6144 | 7168 | 8192;
    }
  | {
      cpu: 2048;
      memoryLimitMiB:
        | 4096
        | 5120
        | 6144
        | 7168
        | 8192
        | 9216
        | 10240
        | 11264
        | 12288
        | 13312
        | 14336
        | 15360
        | 16384;
    }
  | {
      cpu: 4096;
      memoryLimitMiB:
        | 8192
        | 9216
        | 10240
        | 11264
        | 12288
        | 13312
        | 14336
        | 15360
        | 16384
        | 17408
        | 18432
        | 19456
        | 20480
        | 21504
        | 22528
        | 23552
        | 24576
        | 25600
        | 26624
        | 27648
        | 28672
        | 29696
        | 30720;
    }
  | {
      cpu: 8192;
      memoryLimitMiB:
        | 16384
        | 20480
        | 24576
        | 28672
        | 32768
        | 36864
        | 40960
        | 45056
        | 49152
        | 53248
        | 57344
        | 61440;
    }
  | {
      cpu: 16384;
      memoryLimitMiB:
        | 32768
        | 40960
        | 49152
        | 57344
        | 65536
        | 73728
        | 81920
        | 90112
        | 98304
        | 106496
        | 114688
        | 122880;
    };

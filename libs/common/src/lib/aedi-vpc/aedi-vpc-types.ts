import type { IResourceRef, IResourceTypeMap, RefType } from '../aedi-types';
import { defaultVpcRefClientOptions } from './aedi-vpc-constants';

export interface VpcRef extends IResourceRef {
  type: RefType.VPC;
  maxAzs?: number;
}

export interface VpcClientRef<T extends VpcRef, O extends object> {
  refType: RefType.VPC;
  ref: T;
  options?: O;
}

export interface VpcConstructRef {
  region: string;
}

export interface VpcRefClientOptions {}

export type DefaultVpcRefClientOptions = typeof defaultVpcRefClientOptions;

export interface VpcTypeMap extends IResourceTypeMap {
  ref: VpcRef;
  options: VpcRefClientOptions;
  defaultOptions: DefaultVpcRefClientOptions;
  constructRef: VpcConstructRef;
  clientRef: VpcClientRef<VpcRef, any>;
}

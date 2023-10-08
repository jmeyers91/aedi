import type { IResourceRef, IResourceTypeMap, RefType } from '../aedi-types';
import { VpcRef } from '../aedi-vpc';
import { defaultClusterRefClientOptions } from './aedi-cluster-constants';

export interface ClusterRef extends IResourceRef {
  type: RefType.CLUSTER;
  vpc: VpcRef;
  privateNamespace?: string;
}

export interface ClusterClientRef<T extends ClusterRef, O extends object> {
  refType: RefType.CLUSTER;
  ref: T;
  options?: O;
}

export interface ClusterConstructRef {
  region: string;
}

export interface ClusterRefClientOptions {}

export type DefaultClusterRefClientOptions =
  typeof defaultClusterRefClientOptions;

export interface ClusterTypeMap extends IResourceTypeMap {
  ref: ClusterRef;
  options: ClusterRefClientOptions;
  defaultOptions: DefaultClusterRefClientOptions;
  constructRef: ClusterConstructRef;
  clientRef: ClusterClientRef<ClusterRef, any>;
}

import type { IResourceRef, IResourceTypeMap, RefType } from '../aedi-types';

export interface StackRef extends IResourceRef {
  type: RefType.STACK;
  mapBucketName: string;
}

export interface StackClientRef<T extends StackRef, O extends object> {
  refType: RefType.STACK;
  ref: T;
  options?: O;
}

export type StackConstructRef = object;
export type StackRefClientOptions = object;
export type DefaultStackRefClientOptions = object;

export interface StackTypeMap extends IResourceTypeMap {
  ref: StackRef;
  options: StackRefClientOptions;
  defaultOptions: DefaultStackRefClientOptions;
  constructRef: StackConstructRef;
  clientRef: StackClientRef<StackRef, any>;
}

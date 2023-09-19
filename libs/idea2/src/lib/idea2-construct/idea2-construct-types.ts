import type { IResourceRef, IResourceTypeMap, RefType } from '../idea2-types';

export interface ConstructRef extends IResourceRef {
  type: RefType.CONSTRUCT;
}

export interface ConstructClientRef<T extends ConstructRef, O extends object> {
  refType: RefType.CONSTRUCT;
  ref: T;
  options?: O;
}

export type ConstructConstructRef = object;
export type ConstructRefClientOptions = object;
export type DefaultConstructRefClientOptions = object;

export interface ConstructTypeMap extends IResourceTypeMap {
  ref: ConstructRef;
  options: ConstructRefClientOptions;
  defaultOptions: DefaultConstructRefClientOptions;
  constructRef: ConstructConstructRef;
  clientRef: ConstructClientRef<ConstructRef, any>;
}

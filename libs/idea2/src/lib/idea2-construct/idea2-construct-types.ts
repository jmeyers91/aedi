import type { IResourceRef, RefType } from '../idea2-types';

export interface ConstructRef extends IResourceRef {
  type: RefType.CONSTRUCT;
}

export interface ConstructClientRef<T extends ConstructRef, O extends object> {
  refType: RefType.CONSTRUCT;
  ref: T;
  options?: O;
}

export type ConstructConstructRef = object;

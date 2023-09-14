import type { IResourceRef, RefType } from '../idea2-types';

export interface SecretRef extends IResourceRef {
  type: RefType.SECRET;
  arn: string;
}

export interface SecretClientRef<T extends SecretRef, O extends object> {
  refType: RefType.SECRET;
  ref: T;
  options?: O;
}

export interface SecretConstructRef {
  secretName: string;
  versionId?: string;
}

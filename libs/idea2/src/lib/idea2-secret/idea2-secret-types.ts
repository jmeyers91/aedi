import type { RefType } from '../idea2-types';

export type SecretRef = {
  type: RefType.SECRET;
  id: string;
  arn: string;
};

export interface SecretClientRef<T extends SecretRef, O extends object> {
  refType: RefType.SECRET;
  ref: T;
  options?: O;
}

export interface SecretConstructRef {
  secretName: string;
  versionId?: string;
}

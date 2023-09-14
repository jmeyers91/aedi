/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IResourceRef, IResourceTypeMap, RefType } from '../idea2-types';

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

export type SecretRefClientOptions = object;
export type DefaultSecretRefClientOptions = object;

export interface SecretTypeMap extends IResourceTypeMap {
  ref: SecretRef;
  options: SecretRefClientOptions;
  defaultOptions: DefaultSecretRefClientOptions;
  constructRef: SecretConstructRef;
  clientRef: SecretClientRef<SecretRef, any>;
}

import type { IResourceRef, IResourceTypeMap, RefType } from '../aedi-types';
import type { defaultDynamoRefClientOptions } from './aedi-dynamo-constants';

export type DynamoKey = 'BINARY' | 'NUMBER' | 'STRING';

export interface DynamoRef<T, PK extends keyof T> extends IResourceRef {
  type: RefType.DYNAMO;
  partitionKey: {
    name: PK;
    type: DynamoKey;
  };
  sortKey?: {
    name: keyof T;
    type: DynamoKey;
  };
}

export type AnyDynamoRef = DynamoRef<any, any>;

export interface DynamoClientRef<T extends DynamoRef<any, any>, O> {
  ref: T;
  refType: RefType.DYNAMO;
  options?: O;
}

export interface DynamoConstructRef {
  tableName: string;
  region: string;
}

export interface DynamoRefClientOptions {
  read?: boolean;
  write?: boolean;
  fullAccess?: boolean;
}

export type DefaultDynamoRefClientOptions =
  typeof defaultDynamoRefClientOptions;

export interface DynamoTypeMap extends IResourceTypeMap {
  ref: AnyDynamoRef;
  options: DynamoRefClientOptions;
  defaultOptions: DefaultDynamoRefClientOptions;
  constructRef: DynamoConstructRef;
  clientRef: DynamoClientRef<AnyDynamoRef, any>;
}

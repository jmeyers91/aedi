/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IResourceRef, RefType } from '../idea2-types';

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

export interface DynamoClientRef<
  T extends DynamoRef<any, any>,
  O extends DynamoRefClientOptions
> {
  ref: T;
  refType: RefType.DYNAMO;
  options?: O;
}

export interface DynamoConstructRef {
  tableName: string;
  region: string;
}

export interface DynamoRefClientOptions {
  readonly?: boolean;
}

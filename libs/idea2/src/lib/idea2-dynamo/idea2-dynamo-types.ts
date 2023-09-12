/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RefType } from '../idea2-types';

export type DynamoKey = 'BINARY' | 'NUMBER' | 'STRING';

export type DynamoRef<T, PK extends keyof T> = {
  type: RefType.DYNAMO;
  id: string;
  partitionKey: {
    name: PK;
    type: DynamoKey;
  };
  sortKey?: {
    name: keyof T;
    type: DynamoKey;
  };
};

export interface DynamoClientRef<
  T extends DynamoRef<any, any>,
  O extends DynamoRefClientOptions
> {
  dynamo: T;
  options?: O;
}

export interface DynamoRefClientOptions {
  readonly?: boolean;
}

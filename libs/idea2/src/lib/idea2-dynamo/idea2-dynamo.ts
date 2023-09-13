/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Idea2App } from '../idea2-app';
import type { DynamoRef, DynamoClientRef } from './idea2-dynamo-types';
import { RefType } from '../idea2-types';

export function table<T, PK extends keyof T>(
  app: Idea2App,
  id: string,
  options: Omit<DynamoRef<T, PK>, 'id' | 'type'>
): DynamoRef<T, PK> {
  const dynamoRef: DynamoRef<T, PK> = {
    ...options,
    type: RefType.DYNAMO,
    id,
  };

  app.addResourceRef(dynamoRef);

  return dynamoRef;
}

export function readonly<T extends DynamoRef<any, any>>(
  dynamo: T
): DynamoClientRef<T, { readonly: true }> {
  return {
    ref: dynamo,
    refType: RefType.DYNAMO,
    options: { readonly: true },
  };
}

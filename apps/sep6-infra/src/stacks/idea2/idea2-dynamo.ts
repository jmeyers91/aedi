/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoClientRef, DynamoRef, RefType } from './idea2-types';
import { Idea2App } from './idea2-app';

export function table<T, PK extends keyof T>(
  app: Idea2App,
  id: string,
  options: Omit<DynamoRef<T, PK>, 'id' | 'type'>
): DynamoRef<T, PK> {
  if (app.tables.has(id)) {
    throw new Error(`Duplicate dynamo table id: ${id}`);
  }

  const dynamoRef: DynamoRef<T, PK> = {
    ...options,
    type: RefType.DYNAMO,
    id,
  };

  app.tables.set(id, dynamoRef);

  return dynamoRef;
}

export function readonly<T extends DynamoRef<any, any>>(
  dynamo: T
): DynamoClientRef<T, { readonly: true }> {
  return { dynamo, options: { readonly: true } };
}

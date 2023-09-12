import { DynamoRef, RefType } from './idea2-types';
import { IdeaApp } from './idea2-app';

export function table<T, PK extends keyof T>(
  app: IdeaApp,
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

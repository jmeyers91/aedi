import { DynamoRef, RefType } from './idea2-types';
import { IdeaApp } from './idea2-app';

export function table(
  app: IdeaApp,
  id: string,
  options: Omit<DynamoRef, 'id' | 'type'>
): DynamoRef {
  if (app.tables.has(id)) {
    throw new Error(`Duplicate dynamo table id: ${id}`);
  }

  const dynamoRef: DynamoRef = {
    ...options,
    type: RefType.DYNAMO,
    id,
  };

  app.tables.set(id, dynamoRef);

  return dynamoRef;
}

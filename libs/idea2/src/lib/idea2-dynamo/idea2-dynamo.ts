import type { DynamoRef } from './idea2-dynamo-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function Table<T, PK extends keyof T>(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<DynamoRef<T, PK>>
) {
  return createResource(RefType.DYNAMO, scope, id, options);
}

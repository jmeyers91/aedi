import type { DynamoRef } from './aedi-dynamo-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Table<T, PK extends keyof T>(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<DynamoRef<T, PK>>,
) {
  return createResource(RefType.DYNAMO, scope, id, options);
}

import type { UserPoolRef } from './idea2-user-pool-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function userPool(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<UserPoolRef>
): UserPoolRef {
  return createResource(RefType.USER_POOL, scope, id, options);
}

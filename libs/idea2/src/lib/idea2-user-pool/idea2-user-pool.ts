import type { Idea2App } from '../idea2-app';
import type { UserPoolRef } from './idea2-user-pool-types';
import { RefType } from '../idea2-types';

export function userPool(
  app: Idea2App,
  id: string,
  options: Omit<UserPoolRef, 'id' | 'type'>
): UserPoolRef {
  if (app.userPools.has(id)) {
    throw new Error(`Duplicate user pool id: ${id}`);
  }

  const userPoolRef: UserPoolRef = {
    ...options,
    type: RefType.USER_POOL,
    id,
  };

  app.userPools.set(id, userPoolRef);

  return userPoolRef;
}

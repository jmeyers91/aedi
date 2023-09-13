import type { Idea2App } from '../idea2-app';
import type { UserPoolRef } from './idea2-user-pool-types';
import { RefType } from '../idea2-types';

export function userPool(
  app: Idea2App,
  id: string,
  options: Omit<UserPoolRef, 'id' | 'type'>
): UserPoolRef {
  const userPoolRef: UserPoolRef = {
    ...options,
    type: RefType.USER_POOL,
    id,
  };

  app.addResourceRef(userPoolRef);

  return userPoolRef;
}

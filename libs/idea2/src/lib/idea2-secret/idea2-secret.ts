import type { Idea2App } from '../idea2-app';
import { RefType } from '../idea2-types';
import { SecretRef } from './idea2-secret-types';

export function secret(
  app: Idea2App,
  id: string,
  options: Omit<SecretRef, 'id' | 'type'>
): SecretRef {
  const secretRef: SecretRef = {
    ...options,
    type: RefType.SECRET,
    id,
  };

  app.addResourceRef(secretRef);

  return secretRef;
}

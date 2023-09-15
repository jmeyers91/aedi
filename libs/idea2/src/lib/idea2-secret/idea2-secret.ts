import type { SecretRef } from './idea2-secret-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function Secret(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<SecretRef>
): SecretRef {
  return createResource(RefType.SECRET, scope, id, options);
}

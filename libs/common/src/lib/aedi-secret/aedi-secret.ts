import type { SecretRef } from './aedi-secret-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Secret(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<SecretRef>,
): SecretRef {
  return createResource(RefType.SECRET, scope, id, options);
}

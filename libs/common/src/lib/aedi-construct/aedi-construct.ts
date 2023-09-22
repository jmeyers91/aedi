import type { ConstructRef } from './aedi-construct-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Construct(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<ConstructRef> = {},
) {
  return createResource(RefType.CONSTRUCT, scope, id, options);
}

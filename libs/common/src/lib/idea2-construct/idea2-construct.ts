import type { ConstructRef } from './idea2-construct-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function Construct(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<ConstructRef> = {}
) {
  return createResource(RefType.CONSTRUCT, scope, id, options);
}

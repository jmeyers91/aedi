import type { VpcRef } from './aedi-vpc-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Vpc(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<VpcRef> = {},
): VpcRef {
  return createResource(RefType.VPC, scope, id, options);
}

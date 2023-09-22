import type { StackRef } from './aedi-stack-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Stack(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<StackRef> = {
    mapBucketName: `${id}-aedi-map-bucket`,
  },
) {
  return createResource(RefType.STACK, scope, id, options);
}

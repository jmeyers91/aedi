import type { StackRef } from './idea2-stack-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function Stack(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<StackRef> = {
    mapBucketName: `${id}-idea2-map-bucket`,
  }
) {
  return createResource(RefType.STACK, scope, id, options);
}

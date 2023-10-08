import type { ClusterRef } from './aedi-cluster-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Cluster(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<ClusterRef>,
): ClusterRef {
  return createResource(RefType.CLUSTER, scope, id, options);
}

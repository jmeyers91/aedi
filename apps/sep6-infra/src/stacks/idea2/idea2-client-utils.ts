import { ClientRef, RefType, ResourceRef } from './idea2-types';

export function getClientRefFromRef(ref: ResourceRef | ClientRef): ClientRef {
  if ('type' in ref) {
    switch (ref.type) {
      case RefType.BUCKET:
        return { bucket: ref };
      case RefType.DYNAMO:
        return { dynamo: ref };
      case RefType.LAMBDA:
        return { lambda: ref };
    }
  }
  return ref;
}

import type { ResourceRef } from './idea2-types';

export class Idea2App {
  public readonly resourceRefs: Map<string, ResourceRef> = new Map();

  addResourceRef(resourceRef: ResourceRef) {
    const key = `${resourceRef.type}.${resourceRef.id}`;
    if (this.resourceRefs.has(key)) {
      throw new Error(
        `Resource with type ${resourceRef.type} and id ${resourceRef.id} has already been registered.`
      );
    }
    this.resourceRefs.set(key, resourceRef);
  }
}

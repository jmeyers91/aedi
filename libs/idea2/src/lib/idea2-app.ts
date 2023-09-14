import type { IIdea2App, ResourceRef } from './idea2-types';

export class Idea2App implements IIdea2App {
  public readonly isIdea2App = true;
  public readonly resourceRefs: ResourceRef[] = [];

  addResourceRef(resourceRef: ResourceRef): void {
    this.resourceRefs.push(resourceRef);
  }
}

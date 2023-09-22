import type { IAediApp, ResourceRef } from './aedi-types';

export class AediApp implements IAediApp {
  public readonly isAediApp = true;
  public readonly resourceRefs: ResourceRef[] = [];

  addResourceRef(resourceRef: ResourceRef): void {
    this.resourceRefs.push(resourceRef);
  }
}

import type {
  CreateResourceOptions,
  IIdea2App,
  IResourceRef,
  Scope,
} from './idea2-types';

export function createResource<R extends IResourceRef>(
  type: R['type'],
  scope: Scope,
  id: string,
  options: CreateResourceOptions<R>
): R {
  const uid = 'isIdea2App' in scope ? id : `${scope.uid}.${id}`;
  const resourceRef: IResourceRef = {
    ...options,
    uid,
    id,
    type,
    getScope() {
      return scope;
    },
  };

  appOf(scope).addResourceRef(resourceRef);

  return resourceRef as R;
}

export function appOf(scope: Scope): IIdea2App {
  while (!('isIdea2App' in scope)) {
    scope = scope.getScope();
  }
  return scope;
}

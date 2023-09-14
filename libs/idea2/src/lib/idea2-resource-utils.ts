import type {
  CreateResourceOptions,
  IIdea2App,
  IResourceRef,
  LookupClientRef,
  LookupOptions,
  ResourceRef,
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

export function grant<
  R extends ResourceRef,
  const O extends Partial<LookupOptions<R['type']>>
>(ref: R, options: O) {
  return {
    ref,
    refType: ref.type,
    options,
  } as Omit<LookupClientRef<R['type']>, 'options' | 'ref' | 'refType'> & {
    options: O;
    ref: R;
    refType: R['type'];
  };
}

import { relative } from 'path';
import type {
  ClientRef,
  CreateResourceOptions,
  IIdea2App,
  IResourceRef,
  LookupClientRef,
  LookupOptions,
  ResourceRef,
  Scope,
} from './idea2-types';
import {
  TransformedRef,
  ResolveRef,
  TransformedRefScope,
} from './idea2-lambda';
import { Callback, Context } from 'aws-lambda';

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
    filepath: getRootCallsiteFilepath(),
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

export function mapRef<
  R extends ResourceRef | ClientRef | TransformedRef<any, any>,
  T,
  S extends TransformedRefScope = TransformedRefScope.STATIC
>(
  ref: R,
  fn: (
    ...args: S extends TransformedRefScope.INVOKE
      ? [
          resolvedRef: ResolveRef<R>,
          event: unknown,
          context: Context,
          callback: Callback
        ]
      : [resolvedRef: ResolveRef<R>]
  ) => T,
  scope?: S
): TransformedRef<R, T> & { transformedRefScope: S } {
  /**
   * Mapping an invoke scope ref into a static scope creates weird behavior where the transform
   * function would only ever receive the request context of the first request received
   * by the lambda execution context. I don't see any value in adding allowing this situation at
   * the moment, and I'm sure it would lead to confusing bugs if used unintentionally.
   */
  if (
    scope === TransformedRefScope.STATIC &&
    'transformedRefScope' in ref &&
    ref.transformedRefScope === TransformedRefScope.INVOKE
  ) {
    throw new Error(
      `You cannot map a ${TransformedRefScope.INVOKE} scope ref to a ${TransformedRefScope.STATIC} scope ref.`
    );
  }
  return {
    transformedRefScope: (scope ?? TransformedRefScope.STATIC) as S,
    transformedRef: ref,
    transform: fn,
  } as any;
}

/**
 * Returns the filepath of the current callsite that is at the root scope.
 */
export function getRootCallsiteFilepath(): string {
  if (process.env.NODE_ENV === 'test') {
    /**
     * For some reason callsites doesn't work correctly in jest, so for now we'll just stub the
     * filename in tests. This filename is only ever relevant at synth-time.
     * CDK also depends on `callsites`, so I expect it to continue working there.
     */
    return '';
  }
  /**
   * Finds the callsite that doesn't happen inside a function.
   */
  const allCallsites = callsites();
  const callsite = allCallsites.find((callsite) => {
    return !callsite.getFunctionName();
  });
  if (!callsite) {
    throw new Error(`Unable to find root callsite.`);
  }
  const absoluteFilepath = callsite.getFileName();
  if (!absoluteFilepath) {
    throw new Error(
      `Unable to resolve file path for absolute path: ${absoluteFilepath} `
    );
  }
  return relative('.', absoluteFilepath);
}

/**
 * From: https://github.com/sindresorhus/callsites
 */
function callsites(): NodeJS.CallSite[] {
  const _prepareStackTrace = Error.prepareStackTrace;
  try {
    let result: NodeJS.CallSite[] = [];
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
      return callSitesWithoutCurrent;
    };
    new Error().stack;
    return result;
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}

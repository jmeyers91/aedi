import { relative } from 'path';
import {
  RefType,
  type ClientRef,
  type CreateResourceOptions,
  type IAediApp,
  type IResourceRef,
  type LookupClientRef,
  type LookupOptions,
  type ResourceRef,
  type Scope,
} from './aedi-types';
import {
  TransformedRef,
  ResolveRef,
  TransformedRefScope,
  EventTransformRef,
} from './aedi-lambda';
import { Callback, Context } from 'aws-lambda';
import { StackRef } from './aedi-stack';

/**
 * The base resource creation function used by all resource types. This function registers the
 * new resource with the aedi app which makes it available for resolution during CDK synthesis.
 *
 * Additionally, `callsites` is used to determine the filepath where the resource was created.
 * Currently this functionality is only used by lambda resources.
 *
 * This function should not be called directly. Instead, call the individual resource functions
 * such as `Bucket` or `Lambda`.
 */
export function createResource<R extends IResourceRef>(
  type: R['type'],
  scope: Scope,
  id: string,
  options: CreateResourceOptions<R>,
): R {
  const uid = 'isAediApp' in scope ? id : `${scope.uid}.${id}`;
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

/**
 * Searches up the resource ref tree until the root aedi app is found.
 * Once found, the app is returned.
 */
export function appOf(scope: Scope): IAediApp {
  while (!('isAediApp' in scope)) {
    scope = scope.getScope();
  }
  return scope;
}

/**
 * Searches up the resource ref tree until a stack resource is found.
 * Once found, the stack is returned.
 */
export function stackOf(resourceRef: ResourceRef): StackRef {
  while (resourceRef.type !== RefType.STACK) {
    resourceRef = resourceRef.getScope() as ResourceRef;
  }
  return resourceRef;
}

/**
 * Binds options to a resource or client ref.
 */
export function grant<
  R extends ResourceRef,
  const O extends Partial<LookupOptions<R['type']>>,
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

/**
 * Transforms the resolved value of a ref. If the transform function is asynchronous, the return value will be
 * resolved before being provided to the lambda. By default, transform refs are cached and are only invoked once
 * at the beginning of a lambda execution context. Alternatively, you can pass `TransformedRefScope.INVOKE` as
 * the 3rd argument to re-run the transform during each invoke. Invoke scoped transforms can access the lambda
 * handler event and context.
 *
 * ## Examples
 *
 * ### Resolve an S3 bucket name from a bucket ref
 *
 * In this example, the resolved value of `bucketName` in the lambda handler is the name of the `profilePicBucket`
 * S3 bucket.
 *
 * ```ts
 * const profilePicBucket = Bucket(scope, 'my-bucket');
 *
 * export const getProfilePicBucketName = Lambda(
 *   scope,
 *   'getProfilePicBucketName',
 *   {
 *      bucketName: mapRef(profilePicBucket, ({ constructRef }) => constructRef.bucketName)
 *   },
 *   ({ bucketName }) => `The bucket name is ${bucketName}`
 * )
 * ```
 *
 * ### Use incoming event data in the transformation
 *
 * In this example, the resolved value of `bucket` in the lambda handler depends on the `userId` data in the
 * incoming request.
 *
 * ```ts
 * const profilePicBucket = Bucket(scope, 'my-bucket');
 *
 * export const getProfilePicBucketName = Lambda(
 *   scope,
 *   'getProfilePicBucketName',
 *   {
 *      bucket: mapRef(
 *        profilePicBucket,
 *        (resolved, event: { userId?: string }) => {
 *          if (event.userId) {
 *            return resolved;
 *          }
 *          return null;
 *        },
 *        TransformedRefScope.INVOKE
 *      )
 *   },
 *   ({ bucket }) => {
 *     if (bucket) {
 *       return 'We have a bucket!';
 *     } else {
 *       return 'No bucket';
 *     }
 *   }
 * )
 * ```
 *
 */
export function mapRef<
  R extends ResourceRef | ClientRef | TransformedRef<any, any>,
  T,
  S extends TransformedRefScope = TransformedRefScope.STATIC,
>(
  ref: R,
  fn: (
    ...args: S extends TransformedRefScope.INVOKE
      ? [
          resolvedRef: ResolveRef<R>,
          event: unknown,
          context: Context,
          callback: Callback,
        ]
      : [resolvedRef: ResolveRef<R>]
  ) => T,
  scope?: S,
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
      `You cannot map a ${TransformedRefScope.INVOKE} scope ref to a ${TransformedRefScope.STATIC} scope ref.`,
    );
  }
  const appliedScope = (scope ?? TransformedRefScope.STATIC) as S;
  return {
    transformedRefScope: appliedScope,
    transformedRef: ref,
    /**
     * Static refs should only ever be run once in an execution context.
     */
    transform: appliedScope === TransformedRefScope.STATIC ? once(fn) : fn,
  } as any;
}

export function mapEvent<E, C>(
  fn: (event: E, context: Context) => C,
): EventTransformRef<E, C> {
  return { transformEvent: fn };
}

/**
 * Ensures a function can only be called once. Repeated calls return a cached result.
 */
export function once<F extends (...args: any[]) => any>(fn: F): F {
  let result: any;
  let called = false;
  return ((...args: any[]): any => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as any;
}

/**
 * Returns the filepath of the current callsite that is at the root scope.
 */
export function getRootCallsiteFilepath(): string {
  // TODO: Disable in any env outside CDK synth
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
      `Unable to resolve file path for absolute path: ${absoluteFilepath} `,
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

import { Context } from 'aws-lambda';
import type {
  ClientRef,
  AediAppHandlerEnv,
  ResourceRef,
  ConstructRefLookupMap,
  TransformedRef,
  ComputeDependencyGroup,
  EventTransformRef,
  LookupConstructRef,
  ResolveRef,
} from './aedi-types';

let cachedEnv: AediAppHandlerEnv | undefined = undefined;

export function resolveComputeRuntimeEnv(): AediAppHandlerEnv {
  if (!cachedEnv) {
    cachedEnv = {
      AEDI_COMPUTE_ID: env('AEDI_COMPUTE_ID'),
      AEDI_COMPUTE_UID: env('AEDI_COMPUTE_UID'),
      AEDI_CONSTRUCT_UID_MAP: createConstructUidMap(),
    };
  }
  return cachedEnv;
}

export function getClientRefFromRef(
  ref: ResourceRef | ClientRef | TransformedRef<any, any>,
): ClientRef {
  if ('transformedRef' in ref) {
    return getClientRefFromRef(ref.transformedRef);
  }
  if ('ref' in ref) {
    return ref;
  }
  return { refType: ref.type, ref } as ClientRef;
}

function createConstructUidMap(): ConstructRefLookupMap {
  const constructMap: ConstructRefLookupMap = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') {
      const match = key.match(/AEDI_REF_(.*)/);
      if (match) {
        const uid = match[1];
        constructMap[uid.replace(/__/g, '.').replace(/_/g, '-')] =
          JSON.parse(value);
      }
    }
  }
  return constructMap;
}

function env(name: string): string {
  const envVar = process.env[name];
  if (!envVar) {
    throw new Error(`Missing env var ${name}`);
  }
  return envVar;
}

export async function resolveComputeDependencies(
  dependencies: ComputeDependencyGroup,
  event?: any,
  context?: Context,
) {
  const { AEDI_CONSTRUCT_UID_MAP: constructUidMap } =
    resolveComputeRuntimeEnv();

  // Resolve dependencies concurrently
  return Object.fromEntries(
    await Promise.all(
      Object.entries(dependencies).map(async ([key, value]) => [
        key,
        await resolveRef(constructUidMap, value, event, context),
      ]),
    ),
  );
}

/**
 * Resolves a single compute dependency.
 * This function is responsible for converting plain compute ref dependency values into resolved
 * construct refs or transformed construct refs.
 * When a resource or resource client ref is passed, it is converted to its corresponding construct ref which
 * can be used to establish a connection with the construct's services.
 * When a transform ref is passed, it is evaluated recursively and the result is passed into the compute.
 */
export async function resolveRef<
  R extends
    | ResourceRef
    | ClientRef
    | TransformedRef<any, any>
    | EventTransformRef<any, any>,
>(
  constructUidMap: ConstructRefLookupMap,
  ref: R,
  event?: any,
  context?: Context,
): Promise<ResolveRef<R>> {
  if ('transformEvent' in ref) {
    return ref.transformEvent(event, context!);
  }

  if (!('transformedRef' in ref)) {
    const clientRef = getClientRefFromRef(ref);
    const resolvedRef = {
      refType: clientRef.refType,
      clientRef,
      constructRef: resolveConstructRef(constructUidMap, clientRef),
    };

    return resolvedRef as ResolveRef<R>;
  }

  /**
   * Recursively resolve transform refs. Invoke refs will be re-computed on each invocation of
   * the lambda, but because static refs wrap their callback in `once`, they will only be computed once.
   */
  return ref.transform(
    await resolveRef(constructUidMap, ref.transformedRef, event, context),
    event,
    context!,
  );
}

/**
 * Finds a client ref's construct ref in the construct map.
 */
function resolveConstructRef<T extends ClientRef>(
  constructUidMap: ConstructRefLookupMap,
  clientRef: T,
): LookupConstructRef<T['refType']> {
  const resourceRef = clientRef.ref;
  const constructRef = constructUidMap[resourceRef.uid];
  if (!constructRef) {
    throw new Error(
      `Unable to resolve construct reference with type ${resourceRef.type} and uid ${resourceRef.uid}`,
    );
  }
  return constructRef as LookupConstructRef<T['refType']>;
}

import type { TransformedRef } from './aedi-lambda';
import type {
  ClientRef,
  AediAppHandlerEnv,
  ResourceRef,
  ConstructRefLookupMap,
} from './aedi-types';

let cachedEnv: AediAppHandlerEnv | undefined = undefined;

export function resolveLambdaRuntimeEnv(): AediAppHandlerEnv {
  if (!cachedEnv) {
    cachedEnv = {
      AEDI_FUNCTION_ID: env('AEDI_FUNCTION_ID'),
      AEDI_FUNCTION_UID: env('AEDI_FUNCTION_UID'),
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

import type { TransformedRef } from './aedi-lambda';
import {
  type ClientRef,
  type AediAppHandlerEnv,
  type ResourceRef,
} from './aedi-types';

let cachedEnv: AediAppHandlerEnv | undefined = undefined;

export function resolveLambdaRuntimeEnv(): AediAppHandlerEnv {
  if (!cachedEnv) {
    cachedEnv = {
      AEDI_FUNCTION_ID: env('AEDI_FUNCTION_ID'),
      AEDI_FUNCTION_UID: env('AEDI_FUNCTION_UID'),
      AEDI_CONSTRUCT_UID_MAP: JSON.parse(env('AEDI_CONSTRUCT_UID_MAP')),
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

function env(name: string): string {
  const envVar = process.env[name];
  if (!envVar) {
    throw new Error(`Missing env var ${name}`);
  }
  return envVar;
}

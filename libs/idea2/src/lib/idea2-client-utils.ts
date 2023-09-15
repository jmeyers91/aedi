/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TransformedRef } from './idea2-lambda';
import {
  type ClientRef,
  type Idea2AppHandlerEnv,
  type ResourceRef,
} from './idea2-types';

let cachedEnv: Idea2AppHandlerEnv | undefined = undefined;

export function resolveLambdaRuntimeEnv(): Idea2AppHandlerEnv {
  if (!cachedEnv) {
    cachedEnv = {
      IDEA_FUNCTION_ID: env('IDEA_FUNCTION_ID'),
      IDEA_FUNCTION_UID: env('IDEA_FUNCTION_UID'),
      IDEA_CONSTRUCT_UID_MAP: JSON.parse(env('IDEA_CONSTRUCT_UID_MAP')),
    };
  }
  return cachedEnv;
}

export function getClientRefFromRef(
  ref: ResourceRef | ClientRef | TransformedRef<any, any>
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

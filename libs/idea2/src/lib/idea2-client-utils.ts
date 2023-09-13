/* eslint-disable @typescript-eslint/no-explicit-any */
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
      IDEA_CONSTRUCT_REF_MAP: JSON.parse(env('IDEA_CONSTRUCT_REF_MAP')),
    };
  }
  return cachedEnv;
}

export function getClientRefFromRef(ref: ResourceRef | ClientRef): ClientRef {
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

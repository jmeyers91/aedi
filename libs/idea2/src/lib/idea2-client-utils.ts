/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ClientRef,
  type Idea2AppHandlerEnv,
  type ResourceRef,
  ConstructRefMap,
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

export function resolveConstructRef<T extends ClientRef>(
  clientRef: T
): ConstructRefMap[T['refType']][string] {
  const resourceRef = clientRef.ref;
  const constructRefMap = resolveLambdaRuntimeEnv().IDEA_CONSTRUCT_REF_MAP;
  const constructRef = constructRefMap[resourceRef.type]?.[resourceRef.id];
  if (!constructRef) {
    throw new Error(
      `Unable to resolve construct reference with type ${resourceRef.type} and id ${resourceRef.id}`
    );
  }
  return constructRef as ConstructRefMap[T['refType']][string];
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

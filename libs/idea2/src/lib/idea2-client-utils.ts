import {
  type ClientRef,
  type Idea2AppHandlerEnv,
  type ResourceRef,
  RefType,
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
  if ('type' in ref) {
    switch (ref.type) {
      case RefType.BUCKET:
        return { bucket: ref };
      case RefType.DYNAMO:
        return { dynamo: ref };
      case RefType.LAMBDA:
        return { lambda: ref };
      case RefType.REST_API:
        return { restApi: ref };
      case RefType.USER_POOL:
        return { userPool: ref };
    }
  }
  return ref;
}

function env(name: string): string {
  const envVar = process.env[name];
  if (!envVar) {
    throw new Error(`Missing env var ${name}`);
  }
  return envVar;
}

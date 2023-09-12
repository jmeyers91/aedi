import { IdeaAppHandlerEnv } from './idea2-types';

let cachedEnv: IdeaAppHandlerEnv | undefined = undefined;

export function resolveLambdaRuntimeEnv(): IdeaAppHandlerEnv {
  if (!cachedEnv) {
    cachedEnv = {
      IDEA_FUNCTION_ID: env('IDEA_FUNCTION_ID'),
      IDEA_CONSTRUCT_REF_MAP: JSON.parse(env('IDEA_CONSTRUCT_REF_MAP')),
    };
  }
  return cachedEnv;
}

function env(name: string): string {
  const envVar = process.env[name];
  if (!envVar) {
    throw new Error(`Missing env var ${name}`);
  }
  return envVar;
}

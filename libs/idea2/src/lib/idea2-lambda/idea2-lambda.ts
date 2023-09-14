/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  LambdaRefFnWithEvent,
  LambdaRef,
  BrandedLambdaRefFnWithEvent,
} from './idea2-lambda-types';
import { relative } from 'path';
import { getLambdaRefHandler } from './idea2-lambda-handler';
import { RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function lambda<C, E, R>(
  scope: Scope,
  id: string,
  context: C,
  fn: LambdaRefFnWithEvent<C, E, R>
): LambdaRef<C, E, R> {
  const callsite = callsites()[1];
  const absoluteFilepath = callsite.getFileName();
  if (!absoluteFilepath) {
    throw new Error(`Unable to resolve file path for lambda: ${id}`);
  }
  const filepath = relative('.', absoluteFilepath);

  const lambdaHandler = getLambdaRefHandler({
    context,
    fn,
  });

  return createResource<LambdaRef<C, E, R>>(RefType.LAMBDA, scope, id, {
    context,
    filepath,
    fn: fn as BrandedLambdaRefFnWithEvent<C, E, R>,
    lambdaHandler,
  });
}

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

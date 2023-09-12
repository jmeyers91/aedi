/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Idea2App } from '../idea2-app';
import type {
  LambdaRefFnWithEvent,
  LambdaRef,
  BrandedLambdaRefFnWithEvent,
} from './idea2-lambda-types';
import { relative } from 'path';
import { getLambdaRefHandler } from './idea2-lambda-handler';
import { RefType } from '../idea2-types';

export function lambda<C, E, R>(
  app: Idea2App,
  id: string,
  context: C,
  fn: LambdaRefFnWithEvent<C, E, R>
): LambdaRef<C, E, R> {
  if (app.lambdas.has(id)) {
    throw new Error(`Duplicate lambda id: ${id}`);
  }
  const callsite = callsites()[1];
  const absoluteFilepath = callsite.getFileName();
  if (!absoluteFilepath) {
    throw new Error(`Unable to resolve file path for lambda: ${id}`);
  }
  const filepath = relative('.', absoluteFilepath);
  const lambdaRefWithoutHandler: Omit<LambdaRef<C, E, R>, 'lambdaHandler'> = {
    type: RefType.LAMBDA,
    id,
    context,
    filepath,
    fn: fn as BrandedLambdaRefFnWithEvent<C, E, R>,
  };
  const lambdaHandler = getLambdaRefHandler(lambdaRefWithoutHandler);
  const lambdaRef: LambdaRef<C, E, R> = {
    ...lambdaRefWithoutHandler,
    lambdaHandler,
  };

  app.lambdas.set(id, lambdaRef);

  return lambdaRef;
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { relative } from 'path';
import { getLambdaRefHandler } from './idea2-handler';
import { LambdaRefFn, LambdaRef, RefType } from './idea2-types';
import { IdeaApp } from './idea2-app';

export function lambda<C, Fn extends LambdaRefFn<C>>(
  app: IdeaApp,
  id: string,
  context: C,
  fn: Fn
): LambdaRef<C, Fn> {
  if (app.lambdas.has(id)) {
    throw new Error(`Duplicate lambda id: ${id}`);
  }
  const callsite = callsites()[1];
  const absoluteFilepath = callsite.getFileName();
  if (!absoluteFilepath) {
    throw new Error(`Unable to resolve file path for lambda: ${id}`);
  }
  const filepath = relative('.', absoluteFilepath);
  const lambdaRefWithoutHandler: Omit<LambdaRef<C, Fn>, 'lambdaHandler'> = {
    type: RefType.LAMBDA,
    id,
    context,
    filepath,
    fn,
  };
  const lambdaHandler = getLambdaRefHandler(lambdaRefWithoutHandler);
  const lambdaRef: LambdaRef<C, Fn> = {
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

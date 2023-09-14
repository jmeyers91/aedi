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
  let filepath: string;

  if (process.env.NODE_ENV === 'test') {
    /**
     * For some reason callsites doesn't work correctly in jest, so for now we'll just stub the
     * filename in tests. This filename is only ever relevant at synth-time.
     * CDK also depends on `callsites`, so I expect it to continue working there.
     */
    filepath = '';
  } else {
    /**
     * Finds the callsite that doesn't happen inside a function.
     */
    const allCallsites = callsites();
    const callsite = allCallsites.find((callsite) => {
      return !callsite.getFunctionName();
    });
    console.log(
      `~~~ Lambda entry`,
      id,
      allCallsites.map((it) => [it.getFunctionName(), it.getFileName()])
    );
    if (!callsite) {
      throw new Error(
        `Unable to find root callsite for lambda ${
          'isIdea2App' in scope ? 'ROOT' : scope.uid
        }.${id}`
      );
    }
    const absoluteFilepath = callsite.getFileName();
    if (!absoluteFilepath) {
      throw new Error(`Unable to resolve file path for lambda: ${id} `);
    }
    filepath = relative('.', absoluteFilepath);
  }

  const lambdaHandler = getLambdaRefHandler({
    uid: 'uid' in scope ? `${scope.uid}.${id}` : id,
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

/**
 * From: https://github.com/sindresorhus/callsites
 */
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

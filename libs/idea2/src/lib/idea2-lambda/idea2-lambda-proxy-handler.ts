import { Handler } from 'aws-lambda';
import { AnyLambdaRef, LambdaHandlerLocation } from './idea2-lambda-types';
import { resolveLambdaRuntimeEnv } from '../idea2-client-utils';
import { getLambdaRefHandler } from './idea2-lambda-handler';
import { getRootCallsiteFilepath } from '../idea2-resource-utils';

export interface LambdaProxyHandler {
  lambdaProxyHandler: Handler;
}

export function lambdaProxyHandler(
  exportVarName: string,
  lambdaRefs: AnyLambdaRef[]
): LambdaProxyHandler {
  const handlerLocation: LambdaHandlerLocation = {
    filepath: getRootCallsiteFilepath(),
    exportKey: `index.${exportVarName}.lambdaProxyHandler`,
  };

  for (const lambdaRef of lambdaRefs) {
    lambdaRef.handlerLocation = handlerLocation;
  }

  let cachedHandler: Handler;

  return {
    lambdaProxyHandler: (event, context, callback) => {
      if (!cachedHandler) {
        const { IDEA_FUNCTION_UID } = resolveLambdaRuntimeEnv();
        const lambdaRef = lambdaRefs.find(
          (ref) => ref.uid === IDEA_FUNCTION_UID
        );
        if (!lambdaRef) {
          throw new Error(
            `Unable to find lambda ref ${IDEA_FUNCTION_UID} in lambdas passed to lambda proxy handler ${handlerLocation.filepath}`
          );
        }
        cachedHandler = getLambdaRefHandler(lambdaRef);
      }
      return cachedHandler(event, context, callback);
    },
  };
}

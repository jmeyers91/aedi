import { Handler } from 'aws-lambda';
import { AnyLambdaRef, LambdaHandlerLocation } from './aedi-lambda-types';
import { resolveLambdaRuntimeEnv } from '../aedi-client-utils';
import { getLambdaRefHandler } from './aedi-lambda-handler';
import { getRootCallsiteFilepath } from '../aedi-resource-utils';

export interface LambdaProxyHandler {
  proxiedRefs: (AnyLambdaRef | LambdaProxyHandler)[];
  lambdaProxyHandler: Handler;
}

export function lambdaProxyHandler(
  exportVarName: string,
  proxiedRefs: (AnyLambdaRef | LambdaProxyHandler)[],
): LambdaProxyHandler {
  const lambdaRefs = proxiedRefs.flatMap(getRefLambdas);

  const handlerLocation: LambdaHandlerLocation = {
    filepath: getRootCallsiteFilepath(),
    exportKey: `index.${exportVarName}.lambdaProxyHandler`,
  };

  for (const ref of lambdaRefs) {
    ref.handlerLocation = handlerLocation;
  }

  function getRefLambdas(
    ref: AnyLambdaRef | LambdaProxyHandler,
  ): AnyLambdaRef[] {
    if ('proxiedRefs' in ref) {
      return ref.proxiedRefs.flatMap(getRefLambdas);
    } else {
      return [ref];
    }
  }

  let cachedHandler: Handler;

  return {
    proxiedRefs,
    lambdaProxyHandler: (event, context, callback) => {
      if (!cachedHandler) {
        const { AEDI_FUNCTION_UID } = resolveLambdaRuntimeEnv();
        const lambdaRef = lambdaRefs.find(
          (ref) => ref.uid === AEDI_FUNCTION_UID,
        );
        if (!lambdaRef) {
          throw new Error(
            `Unable to find lambda ref ${AEDI_FUNCTION_UID} in lambdas passed to lambda proxy handler ${handlerLocation.filepath}`,
          );
        }
        cachedHandler = getLambdaRefHandler(lambdaRef);
      }
      return cachedHandler(event, context, callback);
    },
  };
}

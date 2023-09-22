import type {
  LambdaRefFnWithEvent,
  LambdaRef,
  BrandedLambdaRefFnWithEvent,
  LambdaHandlerLocation,
  LambdaDependencyGroup,
} from './aedi-lambda-types';
import { getLambdaRefHandler } from './aedi-lambda-handler';
import { RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function Lambda<const C extends LambdaDependencyGroup, E, R>(
  scope: Scope,
  id: string,
  context: C,
  fn: LambdaRefFnWithEvent<C, E, R>,
): LambdaRef<C, E, R> {
  const lambdaHandler = getLambdaRefHandler({
    uid: 'uid' in scope ? `${scope.uid}.${id}` : id,
    context,
    fn,
  });

  const lambda = createResource<LambdaRef<C, E, R>>(RefType.LAMBDA, scope, id, {
    context,
    fn: fn as BrandedLambdaRefFnWithEvent<C, E, R>,
    lambdaHandler,
  });

  // Can be overridden by lambda handler proxies
  const initialLocation: LambdaHandlerLocation = {
    filepath: lambda.filepath,
    exportKey: `index.${lambda.id}.lambdaHandler`,
  };
  lambda.handlerLocation = initialLocation;

  return lambda;
}

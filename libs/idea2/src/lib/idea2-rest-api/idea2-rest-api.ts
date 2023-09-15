/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayEvent, Context } from 'aws-lambda';
import type {
  LambdaRef,
  LambdaRefFnWithEvent,
} from '../idea2-lambda/idea2-lambda-types';
import type { RestApiRef, RestApiRefRoute } from './idea2-rest-api-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';
import { Lambda } from '../idea2-lambda';

export type RouteEvent = APIGatewayEvent;
export type RouteResponse<_T> = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
  __body?: _T;
};

export function RestApi(
  scope: Scope,
  id: string,
  options: Omit<CreateResourceOptions<RestApiRef>, 'routes'> = {}
): RestApiRef {
  return createResource<RestApiRef>(RefType.REST_API, scope, id, {
    ...options,
    routes: [],
  });
}

export type RouteLambdaRef =
  | LambdaRef<any, APIGatewayEvent, RouteResponse<any>>
  | LambdaRef<any, APIGatewayEvent, Promise<RouteResponse<any>>>;

type IsParameter<Part> = Part extends `{${infer ParamName}}`
  ? ParamName
  : never;
type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredParts<PartB>
  : IsParameter<Path>;
type PathParameters<P extends string> = { [K in FilteredParts<P>]: string };

export function LambdaRoute<L extends RouteLambdaRef>(
  restApiRef: RestApiRef,
  method: string,
  path: string,
  lambdaRef: L
): L {
  const route: RestApiRefRoute = {
    method,
    path,
    lambdaRef,
  };

  restApiRef.routes.push(route);

  return lambdaRef;
}

export function route<P extends string, C, R>(
  restApiRef: RestApiRef,
  lambdaId: string,
  method: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >
): LambdaRef<C, RouteEvent, RouteResponse<R>> {
  const wrappedLambdaHandlerFn = async (
    ctx: any,
    event: RouteEvent,
    lambdaContext: Context
  ): Promise<RouteResponse<R>> => {
    try {
      return reply(
        await fn(
          ctx,
          event as RouteEvent & { pathParameters: PathParameters<P> },
          lambdaContext
        )
      );
    } catch (error) {
      const { message, statusCode = 500 } = error as Error & {
        statusCode?: number;
      };
      return errorReply(message, statusCode) as any;
    }
  };

  const lambda = Lambda(
    restApiRef.getScope(),
    lambdaId,
    lambdaContext,
    wrappedLambdaHandlerFn
  );

  return LambdaRoute(restApiRef, method, path, lambda) as any;
}

export function Get<P extends string, C, R>(
  restApiRef: RestApiRef,
  lambdaId: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >
) {
  return route(restApiRef, lambdaId, 'GET', path, lambdaContext, fn);
}

export function Post<P extends string, C, R>(
  restApiRef: RestApiRef,
  lambdaId: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >
) {
  return route(restApiRef, lambdaId, 'POST', path, lambdaContext, fn);
}

export function Put<P extends string, C, R>(
  restApiRef: RestApiRef,
  lambdaId: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >
) {
  return route(restApiRef, lambdaId, 'PUT', path, lambdaContext, fn);
}

export function Patch<P extends string, C, R>(
  restApiRef: RestApiRef,
  lambdaId: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >
) {
  return route(restApiRef, lambdaId, 'PATCH', path, lambdaContext, fn);
}

export function Delete<P extends string, C, R>(
  restApiRef: RestApiRef,
  lambdaId: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >
) {
  return route(restApiRef, lambdaId, 'DELETE', path, lambdaContext, fn);
}

export function reply<T>(body?: T, statusCode = 200): RouteResponse<T> {
  return {
    statusCode,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Origin': `*`,
    },
  };
}

export function errorReply<T>(
  error: T,
  statusCode = 400
): RouteResponse<{ error: T }> {
  return reply(
    {
      error,
    },
    statusCode
  );
}

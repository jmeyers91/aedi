import type { APIGatewayEvent, Context } from 'aws-lambda';
import { Type, Static, TObject } from '@sinclair/typebox';
import type {
  AnyLambdaRef,
  EventTransformRef,
  LambdaDependencyGroup,
  LambdaRef,
  LambdaRefFnWithEvent,
} from '../idea2-lambda/idea2-lambda-types';
import type {
  InferRequestBody,
  InferRequestQueryParams,
  RestApiRef,
  RestApiRefRoute,
} from './idea2-rest-api-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource, mapEvent } from '../idea2-resource-utils';
import {
  Lambda,
  LambdaProxyHandler,
  lambdaProxyHandler,
} from '../idea2-lambda';

const foo = Type.Object({
  foo: Type.String(),
});

export type RouteEvent = APIGatewayEvent;
export type RouteResponse<T> = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
  __body?: T;
};

export function RestApi(
  scope: Scope,
  id: string,
  options: Omit<CreateResourceOptions<RestApiRef>, 'routes'> = {},
): RestApiRef {
  return createResource<RestApiRef>(RefType.REST_API, scope, id, {
    ...options,
    routes: [],
  });
}

export type RouteLambdaRef =
  | LambdaRef<any, APIGatewayEvent, RouteResponse<any>>
  | LambdaRef<any, APIGatewayEvent, Promise<RouteResponse<any>>>;

// Utilities for inferring path param variable names
type IsParameter<Part> = Part extends `{${infer ParamName}}`
  ? ParamName extends `${infer WithoutPlus}+`
    ? WithoutPlus
    : ParamName
  : never;
type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredParts<PartB>
  : IsParameter<Path>;
type PathParameters<P extends string> = { [K in FilteredParts<P>]: string };

export function LambdaRoute<L extends RouteLambdaRef>(
  restApiRef: RestApiRef,
  method: string,
  path: string,
  lambdaRef: L,
): L {
  const route: RestApiRefRoute = {
    method,
    path,
    lambdaRef,
  };

  restApiRef.routes.push(route);

  return lambdaRef;
}

export function Route<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  restApiRef: RestApiRef,
  lambdaId: L,
  method: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
): LambdaRef<C, RouteEvent, RouteResponse<R>> & {
  __route?: {
    path: P;
    operationName: L;
    inputs: PathParameters<P> &
      InferRequestBody<C> &
      InferRequestQueryParams<C>;
    result: R;
    lambdaContext: C;
  };
} {
  const wrappedLambdaHandlerFn = async (
    ctx: any,
    event: RouteEvent,
    lambdaContext: Context,
  ): Promise<RouteResponse<R>> => {
    try {
      return reply(
        await fn(
          ctx,
          event as RouteEvent & { pathParameters: PathParameters<P> },
          lambdaContext,
        ),
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
    wrappedLambdaHandlerFn,
  );

  return LambdaRoute(restApiRef, method, path, lambda) as any;
}

export function Get<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  restApiRef: RestApiRef,
  lambdaId: L,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route(restApiRef, lambdaId, 'GET', path, lambdaContext, fn);
}

export function Post<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  restApiRef: RestApiRef,
  lambdaId: L,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route(restApiRef, lambdaId, 'POST', path, lambdaContext, fn);
}

export function Put<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  restApiRef: RestApiRef,
  lambdaId: L,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route(restApiRef, lambdaId, 'PUT', path, lambdaContext, fn);
}

export function Patch<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  restApiRef: RestApiRef,
  lambdaId: L,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route(restApiRef, lambdaId, 'PATCH', path, lambdaContext, fn);
}

export function Delete<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  restApiRef: RestApiRef,
  lambdaId: L,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route(restApiRef, lambdaId, 'DELETE', path, lambdaContext, fn);
}

export class Reply<T> implements RouteResponse<T> {
  statusCode!: number;
  body?: string | undefined;
  headers?: Record<string, string> | undefined;
  __body?: T | undefined;

  constructor(response: RouteResponse<T>) {
    Object.assign(this, response);
  }
}

export function reply<T>(
  bodyObject?: T | Reply<T>,
  statusCode?: number,
  headersObject?: Record<string, string>,
): Reply<T> {
  /**
   * Unwrap nested reply calls automatically.
   * This enables returning a `reply` call from a route handler that wraps replies automatically.
   */
  if (bodyObject instanceof Reply) {
    return bodyObject;
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Origin': '*',
  };
  let body: string | undefined;

  if (typeof bodyObject === 'string') {
    body = bodyObject;
    headers['Content-Type'] = 'text/html; charset=utf-8';
  } else if (bodyObject !== null && bodyObject !== undefined) {
    body = JSON.stringify(bodyObject);
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }

  if (headersObject) {
    Object.assign(headers, headersObject);
  }

  return new Reply({
    statusCode: statusCode ?? 200,
    body,
    headers,
  });
}

export function errorReply<T>(
  error: T,
  statusCode = 400,
): RouteResponse<{ error: T }> {
  return reply(
    {
      error,
    },
    statusCode,
  );
}

export function Body<T extends TObject<any>>(
  bodySchema: T,
): EventTransformRef<APIGatewayEvent, Static<T>> & {
  bodySchema: T;
  __body?: Static<T>;
} {
  return Object.assign(
    mapEvent((event: APIGatewayEvent) => {
      return JSON.parse(event.body ?? '{}') as T;
    }),
    { bodySchema },
  );
}

export function QueryParams<T extends TObject<any>>(
  queryParamSchema: T,
): EventTransformRef<APIGatewayEvent, Static<T>> & {
  queryParamSchema: T;
  __queryParams?: Static<T>;
} {
  return Object.assign(
    mapEvent((event: APIGatewayEvent) => {
      return (event.queryStringParameters ?? {}) as T;
    }),
    { queryParamSchema },
  );
}

export function isBodyDependency(
  value: unknown,
): value is { bodySchema: TObject<any> } {
  return !!(value && typeof value === 'object' && 'bodySchema' in value);
}

export function isQueryParamsDependency(
  value: unknown,
): value is { queryParamSchema: TObject<any> } {
  return !!(value && typeof value === 'object' && 'queryParamSchema' in value);
}

export function withRoutes<R extends object>(
  exportName: string,
  restApiRef: RestApiRef,
  routes: R,
): RestApiRef & LambdaProxyHandler & { __routes?: R } {
  return Object.assign(
    restApiRef,
    lambdaProxyHandler(
      exportName,
      Object.values(routes).filter(
        (it): it is AnyLambdaRef =>
          (it as AnyLambdaRef)?.type === RefType.LAMBDA,
      ),
    ),
  );
}

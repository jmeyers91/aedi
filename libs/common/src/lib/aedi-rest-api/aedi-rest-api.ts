import type { APIGatewayEvent, Context } from 'aws-lambda';
import { Static, TObject } from '@sinclair/typebox';
import type {
  AnyLambdaRef,
  EventTransformRef,
  LambdaDependencyGroup,
  LambdaRef,
  LambdaRefFnWithEvent,
} from '../aedi-lambda/aedi-lambda-types';
import type {
  InferRequestBody,
  InferRequestQueryParams,
  RestApiRef,
  RestApiRefRoute,
} from './aedi-rest-api-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import {
  LambdaResultError,
  createResource,
  mapEvent,
} from '../aedi-resource-utils';
import { Lambda, LambdaProxyHandler, lambdaProxyHandler } from '../aedi-lambda';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import Ajv from 'ajv';

let ajv: Ajv;

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

export function FullRoute<
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

export function Route<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  method: string,
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
): ((
  restApiRef: RestApiRef,
  lambdaId: L,
) => LambdaRef<C, RouteEvent, RouteResponse<R>>) & {
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
  return (restApiRef: RestApiRef, lambdaId: L) =>
    FullRoute(restApiRef, lambdaId, method, path, lambdaContext, fn);
}

export function GetLambda<
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
  return FullRoute(restApiRef, lambdaId, 'GET', path, lambdaContext, fn);
}

export function PostLambda<
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
  return FullRoute(restApiRef, lambdaId, 'POST', path, lambdaContext, fn);
}

export function PutLambda<
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
  return FullRoute(restApiRef, lambdaId, 'PUT', path, lambdaContext, fn);
}

export function PatchLambda<
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
  return FullRoute(restApiRef, lambdaId, 'PATCH', path, lambdaContext, fn);
}

export function DeleteLambda<
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
  return FullRoute(restApiRef, lambdaId, 'DELETE', path, lambdaContext, fn);
}

export function Get<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route<P, L, C, R>('GET', path, lambdaContext, fn);
}

export function Post<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route<P, L, C, R>('POST', path, lambdaContext, fn);
}

export function Put<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route<P, L, C, R>('PUT', path, lambdaContext, fn);
}

export function Patch<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route<P, L, C, R>('PATCH', path, lambdaContext, fn);
}

export function Delete<
  P extends string,
  L extends string,
  C extends LambdaDependencyGroup,
  R,
>(
  path: P,
  lambdaContext: C,
  fn: LambdaRefFnWithEvent<
    C,
    RouteEvent & { pathParameters: PathParameters<P> },
    R
  >,
) {
  return Route<P, L, C, R>('DELETE', path, lambdaContext, fn);
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

/**
 * Adds body validation to a rest API route lambda.
 * The body will be validated against your schema and passed into the lambda handler using
 * the name specified in the lambda dependency object.
 *
 * Additionally, the API Gateway route will include body validation using the schema provided.
 * API gateway's schema checking should cover all of our needs, so no additional checking is
 * necessary in the lambda runtime.
 */
export function Body<T extends TObject<any>>(
  bodySchema: T,
): EventTransformRef<APIGatewayEvent, Static<T>> & {
  bodySchema: T;
  __body?: Static<T>;
} {
  const ajv = getAjv();
  const validate = ajv.compile(bodySchema);
  return Object.assign(
    mapEvent(async (event: APIGatewayEvent) => {
      const body = JSON.parse(event.body ?? '{}');

      if (validate(body)) {
        return body;
      }

      const errorMessage = `Request body validation error.`;

      // Throw the error with an associated 400 bad request response
      throw new LambdaResultError(
        errorMessage,
        // This reply matches the format of validation errors returned by our rest api
        reply(
          {
            message: errorMessage,
            errors: validate.errors,
            statusCode: '400',
            type: 'BAD_REQUEST_PARAMETERS',
          },
          400,
        ),
      );
    }),
    { bodySchema },
  );
}

/**
 * Adds query parameter validation to a rest API route lambda.
 * The query parameters will be validated against your schema and passed into the lambda handler using
 * the name specified in the lambda dependency object.
 *
 * Additionally, the API Gateway route will include request parameter validation. Currently this functionality
 * is limited to checking if parameters are set or not, but the lambda will also do full schema validation to
 * fill in the missing functionality.
 */
export function Params<T extends TObject<any>>(
  queryParamSchema: T,
): EventTransformRef<APIGatewayEvent, Static<T>> & {
  queryParamSchema: T;
  __queryParams?: Static<T>;
} {
  /**
   * API Gateway only validates whether or not a query param is set. They don't do any
   * schema validation on those query params. The logic below adds schema validation to
   * the query params to fill in the missing functionality in the lambda.
   */
  const ajv = getAjv();
  const validate = ajv.compile(queryParamSchema);
  return Object.assign(
    mapEvent((event: APIGatewayEvent) => {
      const queryStringParameters = event.queryStringParameters ?? {};

      if (validate(queryStringParameters)) {
        return queryStringParameters;
      }
      const errorMessage = 'Request param validation error.';

      // Throw the error with an associated 400 bad request response
      throw new LambdaResultError(
        errorMessage,
        // This reply matches the format of validation errors returned by our rest api
        reply(
          {
            message: errorMessage,
            errors: validate.errors,
            statusCode: '400',
            type: 'BAD_REQUEST_PARAMETERS',
          },
          400,
        ),
      );
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

export function Api<R extends object>(
  scope: Scope,
  id: string,
  routes: R,
  restApiOptions: Parameters<typeof RestApi>[2] = {},
) {
  const restApi = RestApi(scope, id, restApiOptions);
  const resolvedRoutes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(routes)) {
    if (typeof value === 'function') {
      resolvedRoutes[key] = value(restApi, key);
    } else {
      resolvedRoutes[key] = value;
    }
  }
  return withRoutes(id, restApi, resolvedRoutes) as RestApiRef &
    LambdaProxyHandler & {
      __routes?: R;
    };
}

function getAjv() {
  if (!ajv) {
    ajv = addFormats(new Ajv({ allErrors: true }), [
      'date-time',
      'time',
      'date',
      'email',
      'hostname',
      'ipv4',
      'ipv6',
      'uuid',
      'regex',
    ]);
    addErrors(ajv);
  }
  return ajv;
}

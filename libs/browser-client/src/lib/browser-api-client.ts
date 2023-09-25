import type {
  ApiMap,
  ApiMapClient,
  ApiMapClientOptions,
  ApiMapRouteClient,
  ApiMapRouteRequestClient,
  ApiExceptionReply,
  ApiRouteMap,
} from '@aedi/common';

export class ApiClientError extends Error {
  public readonly response: Response;
  public readonly data: unknown;

  constructor(message: string, response: Response, data: unknown) {
    super(message);
    this.response = response;
    this.data = data;
  }
}

export class ApiClientException extends ApiClientError {
  public override readonly data: ApiExceptionReply;

  constructor(message: string, response: Response, data: ApiExceptionReply) {
    super(message, response, data);
    this.data = data;
  }

  findErrorAtPath(path: string) {
    if (path[0] !== '/') {
      path = '/' + path;
    }
    return this.data.errors?.find((error) => error.instancePath === path)
      ?.message;
  }

  getFieldErrorCount() {
    return this.data.errors?.length ?? 0;
  }
}

export function createBrowserApiClient<M>(
  apiMap: M,
  clientOptions: ApiMapClientOptions = {},
): ApiMapClient<M> {
  const apiClient: ApiMapClient<any> = {};

  clientOptions = {
    ...clientOptions,
    // Remove the trailing space from the base URL to avoid double-slash issues
    baseUrl: clientOptions.baseUrl?.replace(/\/$/, ''),
  };

  for (const [key, routeMap] of Object.entries(apiMap as ApiMap)) {
    const requestFn: ApiMapRouteRequestClient<any> = async (requestInputs) =>
      sendApiRequest({
        clientOptions,
        routeMap,
        requestInputs,
      });

    const dataFn: ApiMapRouteClient<any> = async (inputs) =>
      handleApiResponse(await requestFn(inputs));

    apiClient[`${key}Request`] = requestFn;
    apiClient[key] = dataFn;
  }

  return apiClient as ApiMapClient<M>;
}

async function sendApiRequest({
  clientOptions: { baseUrl, getHeaders },
  routeMap,
  requestInputs,
}: {
  clientOptions: ApiMapClientOptions;
  routeMap: ApiRouteMap<any>;
  requestInputs: any;
}) {
  const fetchOptions: RequestInit = {
    method: routeMap.method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (getHeaders) {
    fetchOptions.headers = Object.assign(
      fetchOptions.headers ?? {},
      await getHeaders(),
    );
  }

  const path = routeMap.path
    .map((part) => {
      if (part.type === 'VARIABLE') {
        return requestInputs[part.value];
      }
      return part.value;
    })
    .join('/');

  const url = baseUrl
    ? new URL(`${baseUrl}/${path}`)
    : new URL(path, window.location.origin);

  if (routeMap.params) {
    for (const key of routeMap.params) {
      const value = requestInputs[key];
      if (typeof value !== 'undefined') {
        url.searchParams.append(key, value);
      }
    }
  }

  if (routeMap.body) {
    const body: Record<string, unknown> = {};
    for (const key of routeMap.body) {
      const value = requestInputs[key];
      if (typeof value !== 'undefined') {
        body[key] = value;
      }
    }
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
}

async function handleApiResponse(response: Response) {
  const contentType = (
    response.headers.get('Content-Type') ?? 'application/json'
  ).split(';')[0];

  let data;
  if (contentType === 'application/json') {
    data = await response.json();
  } else if (
    contentType === 'application/x-www-form-urlencoded' ||
    contentType === 'multipart/form-data'
  ) {
    data = await response.formData();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = `Request failed with status: ${response.status}`;
    const error = isApiExceptionReply(data)
      ? new ApiClientException(errorMessage, response, data)
      : new ApiClientError(errorMessage, response, data);

    throw error;
  }

  return data;
}

function isApiExceptionReply(value: unknown): value is ApiExceptionReply {
  return !!(
    value &&
    typeof value === 'object' &&
    'statusCode' in value &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

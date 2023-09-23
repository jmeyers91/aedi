import type {
  ApiMap,
  ApiMapClient,
  ApiMapClientOptions,
  ApiMapRouteClient,
  ApiMapRouteRequestClient,
} from '@aedi/common';

export class ApiError extends Error {
  public readonly response: Response;
  public readonly data: unknown;

  constructor(message: string, response: Response, data: unknown) {
    super(message);
    this.response = response;
    this.data = data;
  }

  // TODO: Clean up types

  findErrorAtPath(path: string) {
    if (this.isValidationError()) {
      return (this.data as any).errors.find(
        (error: any) => error?.instancePath === path,
      )?.message;
    }
  }

  isValidationError() {
    return Array.isArray((this.data as any)?.errors);
  }
}

export function createBrowserApiClient<M>(
  apiMap: M,
): (options: ApiMapClientOptions) => ApiMapClient<M> {
  return (options) => {
    const apiClient: ApiMapClient<any> = {};
    const baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash from base URL to avoid any double-slash issues

    for (const [key, routeMap] of Object.entries(apiMap as ApiMap)) {
      const requestFn: ApiMapRouteRequestClient<any> = async (inputs) => {
        const fetchOptions: RequestInit = {
          method: routeMap.method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (options.getHeaders) {
          fetchOptions.headers = Object.assign(
            fetchOptions.headers ?? {},
            await options.getHeaders(),
          );
        }

        const path = routeMap.path
          .map((part) => {
            if (part.type === 'VARIABLE') {
              return inputs[part.value];
            }
            return part.value;
          })
          .join('/');
        const url = new URL(`${baseUrl}/${path}`);

        if (routeMap.params) {
          for (const key of routeMap.params) {
            const value = inputs[key];
            if (typeof value !== 'undefined') {
              url.searchParams.append(key, value);
            }
          }
        }

        if (routeMap.body) {
          const body: Record<string, unknown> = {};
          for (const key of routeMap.body) {
            const value = inputs[key];
            if (typeof value !== 'undefined') {
              body[key] = value;
            }
          }
          fetchOptions.body = JSON.stringify(body);
        }

        return fetch(url, fetchOptions);
      };

      const dataFn: ApiMapRouteClient<any> = async (inputs) => {
        const response = await requestFn(inputs);
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
          throw new ApiError(
            `Request failed with status: ${response.status}`,
            response,
            data,
          );
        }

        return data;
      };

      apiClient[`${key}Request`] = requestFn;
      apiClient[key] = dataFn;
    }

    return apiClient as ApiMapClient<M>;
  };
}

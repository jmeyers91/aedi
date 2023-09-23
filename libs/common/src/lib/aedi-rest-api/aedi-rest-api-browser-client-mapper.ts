import { findBodySchema, findQueryParamSchema } from './aedi-rest-api';
import {
  ApiMap,
  ApiRouteMap,
  ApiRoutePathPart,
  InferApiMapFromResourceRef,
} from './aedi-rest-api-browser-client-types';
import { RestApiRef } from './aedi-rest-api-types';

/**
 * Converts a Rest API resource into an API map that can be used by a client
 * to communicate with the API.
 * The map contains all the information a JS client needs to establish an RPC
 * connection. This info includes:
 *
 * - The RPC function name (eg. `updateContact`).
 * - The REST resource path and verb (eg. `PUT /contacts/{contactId}`).
 * - The names of any request body fields or URL params the endpoint expects.
 *
 * Additionally, the map can include optional route type information in the form of
 * branded types. These types are used by the browser client to provide type safety
 * when working with the client.
 */
export function createBrowserClientMap<R extends RestApiRef>(
  restApiRef: R,
): InferApiMapFromResourceRef<R> {
  const apiMap: ApiMap = {};

  for (const route of restApiRef.routes) {
    const routeBodySchema = findBodySchema(route);
    const routeParamSchema = findQueryParamSchema(route);

    const routeMap: ApiRouteMap<any> = {
      method: route.method,
      path: parseRoutePath(route.path),
    };
    if (routeBodySchema?.properties) {
      routeMap.body = Object.keys(routeBodySchema.properties);
    }
    if (routeParamSchema?.properties) {
      routeMap.params = Object.keys(routeParamSchema.properties);
    }

    apiMap[route.lambdaRef.id] = routeMap;
  }

  return apiMap as InferApiMapFromResourceRef<R>;
}

/**
 * Converts API gateway path strings into an array of part objects.
 * Example:
 * ```ts
 * parseRoutePath("/contacts/view/{contactId+}");
 * // Returns:
 * [
 *   { value: "contacts", type: "STRING" },
 *   { value: "view", type: "STRING" },
 *   { value: "contactId", type: "VARIABLE" }
 * ]
 * ```
 */
function parseRoutePath(path: string): ApiRoutePathPart[] {
  return path
    .split('/')
    .filter((part) => part.length > 0)
    .map((part) => {
      const match = part.match(/\{(.+?)\+?\}/);
      if (match) {
        return { type: 'VARIABLE', value: match[1] };
      }
      return { type: 'STRING', value: part };
    });
}

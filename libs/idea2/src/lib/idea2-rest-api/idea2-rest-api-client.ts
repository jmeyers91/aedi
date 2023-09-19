/* eslint-disable @typescript-eslint/no-explicit-any */
import { RestApiClientRef, RestApiRef } from './idea2-rest-api-types';
import { mapRef } from '../idea2-resource-utils';

export type FetchClient = (
  path: string,
  init?: RequestInit
) => Promise<Response>;

export function FetchClient<R extends RestApiRef | RestApiClientRef<any, any>>(
  bucketRef: R
) {
  return mapRef(bucketRef, ({ constructRef: { url } }): FetchClient => {
    url = url.endsWith('/') ? url.slice(0, -1) : url; // remove trailing space
    return (path: string, init?: RequestInit): Promise<Response> => {
      return fetch(`${url}/${path}`, init);
    };
  });
}

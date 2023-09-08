import { RequestMethod } from '@nestjs/common';

export enum RequestMethodString {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  ALL = 'ALL',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  SEARCH = 'SEARCH',
}

export function getRequestMethodString(
  requestMethod: RequestMethod
): RequestMethodString {
  switch (requestMethod) {
    case RequestMethod.GET:
      return RequestMethodString.GET;
    case RequestMethod.POST:
      return RequestMethodString.POST;
    case RequestMethod.PUT:
      return RequestMethodString.PUT;
    case RequestMethod.DELETE:
      return RequestMethodString.DELETE;
    case RequestMethod.PATCH:
      return RequestMethodString.PATCH;
    case RequestMethod.ALL:
      return RequestMethodString.ALL;
    case RequestMethod.OPTIONS:
      return RequestMethodString.OPTIONS;
    case RequestMethod.HEAD:
      return RequestMethodString.HEAD;
    case RequestMethod.SEARCH:
      return RequestMethodString.SEARCH;
  }
}

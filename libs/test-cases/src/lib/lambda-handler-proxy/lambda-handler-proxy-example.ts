import {
  GetLambda,
  PostLambda,
  RestApi,
  lambdaProxyHandler,
} from '@aedi/common';
import { Scope } from '../app';

const scope = Scope('lambda-handler-proxy-example');
export const api = RestApi(scope, 'api');

const lambdas = [
  GetLambda(api, 'healthcheck', '/healthcheck', {}, () => ({
    testName: 'healthcheck',
    success: true,
  })),

  PostLambda(api, 'echo', '/echo', {}, (_, event) =>
    JSON.parse(event.body ?? '{}'),
  ),
];

export const handler = lambdaProxyHandler('handler', lambdas);

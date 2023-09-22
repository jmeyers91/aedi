import { Get, Post, RestApi, lambdaProxyHandler } from '@aedi/common';
import { Scope } from '../idea';

const scope = Scope('lambda-handler-proxy-example');
export const api = RestApi(scope, 'api');

const lambdas = [
  Get(api, 'healthcheck', '/healthcheck', {}, () => ({
    testName: 'healthcheck',
    success: true,
  })),

  Post(api, 'echo', '/echo', {}, (_, event) => JSON.parse(event.body ?? '{}')),
];

export const handler = lambdaProxyHandler('handler', lambdas);

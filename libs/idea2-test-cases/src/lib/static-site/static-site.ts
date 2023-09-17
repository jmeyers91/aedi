import { Get, RestApi, StaticSite } from '@sep6/idea2';
import { Scope } from '../idea';

const scope = Scope('static-site');

const api = RestApi(scope, 'api');

export const healthcheck = Get(api, 'healthcheck', '/healthcheck', {}, () => ({
  healthy: true,
}));

export const staticSite = StaticSite(scope, 'site', {
  assetPath: './dist/apps/idea2-static-site-test-app',
  clientConfig: {
    api,
    title: 'client config title',
  },
});

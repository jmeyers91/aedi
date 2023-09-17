import { StaticSite } from '@sep6/idea2';
import { Scope } from '../idea';

const scope = Scope('static-site');

export const staticSite = StaticSite(scope, 'site', {
  assetPath: './dist/apps/idea2-static-site-test-app',
  clientConfig: {
    value1: 'test-123',
    value2: {
      id: 100,
      value: 'test',
    },
  },
});

import { App, Environment } from 'aws-cdk-lib';

import { Idea2Stack } from './stacks/idea2/idea2-stack';

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// new ApiStack(app, 'sep6-api-stack', {
//   env,
//   defaultApiDomain: DomainId.API,
//   domains: {
//     [DomainId.API]: {
//       domainName: 'api.sep6.smplj.xyz',
//       domainZone: 'smplj.xyz',
//     },
//     [DomainId.APP]: {
//       domainName: 'sep6.smplj.xyz',
//       domainZone: 'smplj.xyz',
//     },
//     [DomainId.ADMIN]: {
//       domainName: 'admin.sep6.smplj.xyz',
//       domainZone: 'smplj.xyz',
//     },
//     [DomainId.ADMIN_API]: {
//       domainName: 'api.admin.sep6.smplj.xyz',
//       domainZone: 'smplj.xyz',
//     },
//   },
//   userPoolDomainPrefixes: {
//     [UserPoolId.APP_USER_POOL]: 'sep6-dev-pool-v2',
//   },
// });

new Idea2Stack(app, 'idea2-stack', { env });

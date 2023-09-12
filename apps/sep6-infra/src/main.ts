import { App, Environment } from 'aws-cdk-lib';

import { Idea2Stack } from './idea2/idea2-stack';
import { idea } from './idea2/example';

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new Idea2Stack(app, 'idea2-stack', { env, idea2App: idea });

import { App, Environment } from 'aws-cdk-lib';

import { Idea2Stack } from '@sep6/idea2-cdk';
import { idea } from '@sep6/idea2-example';

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new Idea2Stack(app, 'idea2-stack', { env, idea2App: idea });

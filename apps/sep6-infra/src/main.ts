import { App, Environment } from 'aws-cdk-lib';

import { Idea2Stack } from '@sep6/idea2-cdk';
import { idea as testCaseIdea } from '@sep6/idea2-test-cases';

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new Idea2Stack(app, 'idea2-test-stack', {
  env,
  idea2App: testCaseIdea,
  mapBucketName: 'idea2-test-stack-construct-map',
});

import { App, Environment } from 'aws-cdk-lib';

import { Idea2CdkApp } from '@aedi/idea2-cdk';
import { idea as testCaseIdea } from '@aedi/idea2-test-cases';

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new Idea2CdkApp({
  idea2App: testCaseIdea,
  cdkApp: app,
  defaultStackProps: { env },

  /**
   * The map bucket is an S3 bucket that will be used to store the construct map for the entire app.
   * This construct map can be fetched and used to determine things like function names, bucket names, API URLs, etc.
   * using the resources defined in your idea2 app.
   *
   * This feature is optional in production, but useful for finding your deployed resources using the refs
   * defined in your application.
   */
  mapBucket: {
    stackName: `idea2-test-map-stack`,
    bucketName: 'idea2-test-stack-construct-map',
  },
});

import { App, Environment } from 'aws-cdk-lib';

import { Idea2CdkApp } from '@sep6/idea2-cdk';
import { idea as testCaseIdea } from '@sep6/idea2-test-cases';

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
   * Used when creating named resources (databases, buckets, lambdas, etc.)
   */
  resourceNamePrefix: `idea2-test-`,

  /**
   * The map bucket is an S3 bucket that will be used to store the construct map for the entire app.
   * This construct map can be fetched and used to determine things like function names, bucket names, API URLs, etc.
   * using the resources defined in your idea2 app.
   */
  mapBucket: {
    stackName: `idea2-test-map-stack`,
    bucketName: 'idea2-test-stack-construct-map',
  },
});

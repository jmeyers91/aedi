import { App, Environment } from 'aws-cdk-lib';

import { AediCdkApp } from '@aedi/cdk';
import { app } from '@aedi/test-cases';

const cdkApp = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new AediCdkApp({
  app,
  cdkApp,
  defaultStackProps: { env },

  /**
   * The map bucket is an S3 bucket that will be used to store the construct map for the entire app.
   * This construct map can be fetched and used to determine things like function names, bucket names, API URLs, etc.
   * using the resources defined in your aedi app.
   *
   * This feature is optional in production, but useful for finding your deployed resources using the refs
   * defined in your application.
   */
  mapBucket: {
    stackName: `aedi-test-map-stack`,
    bucketName: 'aedi-test-stack-construct-map',
  },
});

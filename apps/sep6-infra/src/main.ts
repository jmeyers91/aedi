import { App } from 'aws-cdk-lib';
import { ApiStack } from './stacks/api-stack';

const app = new App();

new ApiStack(app, 'sep6-api-stack');

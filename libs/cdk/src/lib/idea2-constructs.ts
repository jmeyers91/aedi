import { RefType } from '@aedi/common';
import { Construct } from 'constructs';
import { Idea2Bucket } from './resources/idea2-bucket-construct';
import { Idea2DynamoTable } from './resources/idea2-dynamo-construct';
import { Idea2LambdaFunction } from './resources/idea2-lambda-construct';
import { Idea2RestApi } from './resources/idea2-rest-api-construct';
import { Idea2UserPool } from './resources/idea2-user-pool-construct';
import { Idea2StaticSite } from './resources/idea2-static-site-construct';
import { Idea2Secret } from './resources/idea2-secret-construct';
import { Idea2Construct } from './resources/idea2-construct-construct';
import { Idea2Stack } from './resources/idea2-stack-construct';

export const idea2Constructs = {
  [RefType.BUCKET]: Idea2Bucket,
  [RefType.CONSTRUCT]: Idea2Construct,
  [RefType.DYNAMO]: Idea2DynamoTable,
  [RefType.LAMBDA]: Idea2LambdaFunction,
  [RefType.REST_API]: Idea2RestApi,
  [RefType.USER_POOL]: Idea2UserPool,
  [RefType.STACK]: Idea2Stack,
  [RefType.SECRET]: Idea2Secret,
  [RefType.STATIC_SITE]: Idea2StaticSite,
} satisfies Record<RefType, { new (...args: any): Construct }>;
export type Idea2Constructs = typeof idea2Constructs;

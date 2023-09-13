/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefType } from '@sep6/idea2';
import { Construct } from 'constructs';
import { Idea2Bucket } from './resources/idea2-bucket';
import { Idea2DynamoTable } from './resources/idea2-dynamo';
import { Idea2LambdaFunction } from './resources/idea2-lambda';
import { Idea2RestApi } from './resources/idea2-rest-api';
import { Idea2UserPool } from './resources/idea2-user-pool';
import { Idea2StaticSite } from './resources/idea2-static-site';

export const idea2Constructs = {
  [RefType.BUCKET]: Idea2Bucket,
  [RefType.DYNAMO]: Idea2DynamoTable,
  [RefType.LAMBDA]: Idea2LambdaFunction,
  [RefType.REST_API]: Idea2RestApi,
  [RefType.USER_POOL]: Idea2UserPool,
  [RefType.STATIC_SITE]: Idea2StaticSite,
} satisfies Record<RefType, { new (...args: any): Construct }>;
export type Idea2Constructs = typeof idea2Constructs;

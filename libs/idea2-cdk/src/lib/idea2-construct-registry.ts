/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefType } from '@sep6/idea2';
import { Construct } from 'constructs';
import { Idea2Bucket } from './idea2-bucket-construct';
import { Idea2DynamoTable } from './idea2-dynamo-construct';
import { Idea2LambdaFunction } from './idea2-lambda-construct';
import { Idea2RestApi } from './idea2-rest-api-construct';
import { Idea2UserPool } from './idea2-user-pool-construct';
import { Idea2StaticSite } from './idea2-static-site-construct';

export const idea2ConstructClassMap = {
  [RefType.BUCKET]: Idea2Bucket,
  [RefType.DYNAMO]: Idea2DynamoTable,
  [RefType.LAMBDA]: Idea2LambdaFunction,
  [RefType.REST_API]: Idea2RestApi,
  [RefType.USER_POOL]: Idea2UserPool,
  [RefType.STATIC_SITE]: Idea2StaticSite,
} satisfies Record<RefType, { new (...args: any): Construct }>;
export type Idea2ConstructClassMap = typeof idea2ConstructClassMap;

export function getIdea2ConstructClass<T extends RefType>(
  refType: T
): (typeof idea2ConstructClassMap)[T] {
  return idea2ConstructClassMap[refType];
}

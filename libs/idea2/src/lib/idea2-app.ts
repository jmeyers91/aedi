/* eslint-disable @typescript-eslint/no-explicit-any */

import type { BucketRef } from './idea2-bucket/idea2-bucket-types';
import type { DynamoRef } from './idea2-dynamo/idea2-dynamo-types';
import type { LambdaRef } from './idea2-lambda/idea2-lambda-types';
import type { RestApiRef } from './idea2-rest-api/idea2-rest-api-types';
import type { UserPoolRef } from './idea2-user-pool/idea2-user-pool-types';

export class Idea2App {
  public readonly lambdas = new Map<string, LambdaRef<any, any, any>>();
  public readonly tables = new Map<string, DynamoRef<any, any>>();
  public readonly buckets = new Map<string, BucketRef>();
  public readonly restApis = new Map<string, RestApiRef>();
  public readonly userPools = new Map<string, UserPoolRef>();
}

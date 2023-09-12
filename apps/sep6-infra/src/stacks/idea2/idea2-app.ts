/* eslint-disable @typescript-eslint/no-explicit-any */

import { LambdaRef, DynamoRef, BucketRef, RestApiRef } from './idea2-types';

export class IdeaApp {
  public readonly lambdas = new Map<string, LambdaRef<any, any, any>>();
  public readonly tables = new Map<string, DynamoRef<any, any>>();
  public readonly buckets = new Map<string, BucketRef>();
  public readonly restApis = new Map<string, RestApiRef>();
}

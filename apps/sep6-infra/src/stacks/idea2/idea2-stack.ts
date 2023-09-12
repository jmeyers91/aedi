/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { idea } from './idea2';
import { Idea2Bucket } from './idea2-bucket-construct';
import { Idea2StackContext } from './idea2-infra-utils';
import { Idea2DynamoTable } from './idea2-dynamo-construct';
import { Idea2LambdaFunction } from './idea2-lambda-construct';

export class Idea2Stack extends Stack implements Idea2StackContext {
  namePrefix: string | undefined;
  caches = new Map<string, Map<string, any>>();

  getCache<T>(cacheId: string): Map<string, T> {
    let cache = this.caches.get(cacheId);
    if (!cache) {
      cache = new Map();
      this.caches.set(cacheId, cache);
    }
    return cache;
  }

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.namePrefix = `${id}-`;

    for (const bucketRef of idea.buckets.values()) {
      Idea2Bucket.cachedFactory(this, bucketRef);
    }

    for (const lambdaRef of idea.lambdas.values()) {
      Idea2LambdaFunction.cachedFactory(this, lambdaRef);
    }

    for (const dynamoRef of idea.tables.values()) {
      Idea2DynamoTable.cachedFactory(this, dynamoRef);
    }

    for (const bucketRef of idea.buckets.values()) {
      Idea2Bucket.cachedFactory(this, bucketRef);
    }
  }
}

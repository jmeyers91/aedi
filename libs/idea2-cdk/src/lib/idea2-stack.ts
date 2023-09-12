/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Idea2Bucket } from './idea2-bucket-construct';
import { Idea2StackContext } from './idea2-infra-utils';
import { Idea2DynamoTable } from './idea2-dynamo-construct';
import { Idea2LambdaFunction } from './idea2-lambda-construct';
import { Idea2RestApi } from './idea2-rest-api-construct';
import { Idea2App } from '@sep6/idea2';
import { writeFileSync } from 'fs';
import { Idea2UserPool } from './idea2-user-pool-construct';

export class Idea2Stack extends Stack implements Idea2StackContext {
  idea2App: Idea2App;
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

  constructor(
    scope: Construct,
    id: string,
    { idea2App, ...props }: StackProps & { idea2App: Idea2App }
  ) {
    super(scope, id, props);

    this.idea2App = idea2App;
    this.namePrefix = `${id}-`;

    for (const restApi of idea2App.restApis.values()) {
      Idea2RestApi.cachedFactory(this, restApi);
    }

    for (const bucketRef of idea2App.buckets.values()) {
      Idea2Bucket.cachedFactory(this, bucketRef);
    }

    for (const lambdaRef of idea2App.lambdas.values()) {
      Idea2LambdaFunction.cachedFactory(this, lambdaRef);
    }

    for (const dynamoRef of idea2App.tables.values()) {
      Idea2DynamoTable.cachedFactory(this, dynamoRef);
    }

    for (const bucketRef of idea2App.buckets.values()) {
      Idea2Bucket.cachedFactory(this, bucketRef);
    }

    for (const userPoolRef of idea2App.userPools.values()) {
      Idea2UserPool.cachedFactory(this, userPoolRef);
    }

    writeFileSync(
      './idea2-report.json',
      JSON.stringify(
        {
          lambdas: Object.fromEntries(idea2App.lambdas.entries()),
          tables: Object.fromEntries(idea2App.tables.entries()),
          buckets: Object.fromEntries(idea2App.buckets.entries()),
          restApis: Object.fromEntries(idea2App.restApis.entries()),
          userPools: Object.fromEntries(idea2App.userPools.entries()),
        },
        null,
        2
      )
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Idea2StackContext, resolveConstruct } from './idea2-infra-utils';
import { Idea2App } from '@sep6/idea2';
import { writeFileSync } from 'fs';

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

    for (const resourceRef of idea2App.resourceRefs.values()) {
      resolveConstruct(this, resourceRef);
    }

    writeFileSync(
      './idea2-report.json',
      JSON.stringify(
        {
          resources: idea2App.resourceRefs,
        },
        null,
        2
      )
    );
  }
}

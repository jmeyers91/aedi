/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Idea2StackContext, resolveConstruct } from './idea2-infra-utils';
import { IResourceRef, Idea2App } from '@sep6/idea2';
import { writeFileSync } from 'fs';

export class Idea2Stack extends Stack implements Idea2StackContext {
  idea2App: Idea2App;
  namePrefix: string | undefined;
  resourceConstructCache = new Map<string, Construct>();

  constructor(
    scope: Construct,
    id: string,
    { idea2App, ...props }: StackProps & { idea2App: Idea2App }
  ) {
    super(scope, id, props);

    this.idea2App = idea2App;
    this.namePrefix = `${id}-`;

    const resourceConstructs = idea2App.resourceRefs.map((resourceRef) => ({
      resourceRef,
      construct: resolveConstruct(this, resourceRef),
    }));

    for (const { resourceRef, construct } of resourceConstructs) {
      console.log(
        `RESOURCE ${resourceRef.uid} -> CONSTRUCT ${construct.toString()}`
      );
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

  getCachedResource(resourceRef: IResourceRef): Construct | undefined {
    return this.resourceConstructCache.get(resourceRef.uid);
  }

  cacheResource(resourceRef: IResourceRef, construct: Construct): void {
    if (this.resourceConstructCache.has(resourceRef.uid)) {
      throw new Error(`Duplicate resource uid detected: ${resourceRef.uid}`);
    }
    this.resourceConstructCache.set(resourceRef.uid, construct);
  }
}

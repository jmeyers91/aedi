/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Idea2StackContext, resolveConstruct } from './idea2-infra-utils';
import { IResourceRef, Idea2App } from '@sep6/idea2';
import { writeFileSync } from 'fs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Idea2LambdaFunction } from './resources/idea2-lambda-construct';

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

    const completeConstructMap: Record<string, object> = {};
    for (const { resourceRef, construct } of resourceConstructs) {
      console.log(
        `RESOURCE ${resourceRef.uid} -> CONSTRUCT ${construct.toString()} ${
          construct instanceof Idea2LambdaFunction
            ? construct.lambdaRef.handlerLocation?.filepath
            : ''
        }`
      );
      if ('getConstructRef' in construct) {
        completeConstructMap[resourceRef.uid] = construct.getConstructRef();
      }
    }

    new StringParameter(this, 'construct-map', {
      parameterName: `${id}-construct-map`,
      stringValue: JSON.stringify(completeConstructMap, null, 2),
    });

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

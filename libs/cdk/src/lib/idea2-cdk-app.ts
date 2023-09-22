import { App, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Idea2CdkAppContext,
  resolveConstruct,
  runWithIdea2CdkAppContext,
} from './idea2-infra-utils';
import { IResourceRef, Idea2App } from '@aedi/common';
import { Idea2Stack } from './resources/idea2-stack-construct';

export class Idea2CdkApp implements Idea2CdkAppContext {
  mode = 'development' as const;
  idea2App: Idea2App;
  cdkApp: App;
  resourceConstructCache = new Map<string, Construct>();
  defaultStackProps: StackProps;
  stackIdPrefix: string;

  constructor({
    idea2App,
    cdkApp,
    defaultStackProps = {},
    stackIdPrefix = '',
  }: {
    idea2App: Idea2App;
    cdkApp: App;
    stackIdPrefix?: string;
    defaultStackProps?: StackProps;

    mapBucket?: {
      stackName: string;
      bucketName: string;
    };
  }) {
    this.idea2App = idea2App;
    this.cdkApp = cdkApp;
    this.defaultStackProps = defaultStackProps;
    this.stackIdPrefix = stackIdPrefix;

    const resourceConstructs = runWithIdea2CdkAppContext(this, () =>
      idea2App.resourceRefs.map((resourceRef) => resolveConstruct(resourceRef)),
    );

    // Create map stack-specific map buckets once all the constructs are resolved
    for (const construct of resourceConstructs) {
      if (construct instanceof Idea2Stack) {
        construct.createMap();
      }
    }
  }

  getCachedResource(
    resourceRef: Pick<IResourceRef, 'uid'>,
  ): Construct | undefined {
    return this.resourceConstructCache.get(resourceRef.uid);
  }

  cacheResource(resourceRef: IResourceRef, construct: Construct): void {
    if (this.resourceConstructCache.has(resourceRef.uid)) {
      throw new Error(`Duplicate resource uid detected: ${resourceRef.uid}`);
    }
    this.resourceConstructCache.set(resourceRef.uid, construct);
  }
}

import { App, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AediCdkAppContext,
  resolveConstruct,
  runWithAediCdkAppContext,
} from './aedi-infra-utils';
import { IResourceRef, AediApp } from '@aedi/common';
import { AediStack } from './resources/aedi-stack-construct';

export class AediCdkApp implements AediCdkAppContext {
  mode = 'development' as const;
  aediApp: AediApp;
  cdkApp: App;
  resourceConstructCache = new Map<string, Construct>();
  defaultStackProps: StackProps;
  stackIdPrefix: string;

  constructor({
    app,
    cdkApp,
    defaultStackProps = {},
    stackIdPrefix = '',
  }: {
    app: AediApp;
    cdkApp: App;
    stackIdPrefix?: string;
    defaultStackProps?: StackProps;

    mapBucket?: {
      stackName: string;
      bucketName: string;
    };
  }) {
    this.aediApp = app;
    this.cdkApp = cdkApp;
    this.defaultStackProps = defaultStackProps;
    this.stackIdPrefix = stackIdPrefix;

    const resourceConstructs = runWithAediCdkAppContext(this, () =>
      app.resourceRefs.map((resourceRef) => resolveConstruct(resourceRef)),
    );

    // Create map stack-specific map buckets once all the constructs are resolved
    for (const construct of resourceConstructs) {
      if (construct instanceof AediStack) {
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

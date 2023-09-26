import { ResourceRef, StackRef } from '@aedi/common';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getAediCdkAppContext } from '../aedi-infra-utils';
import { Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BucketDeployment } from 'aws-cdk-lib/aws-s3-deployment';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class AediStack extends Stack {
  public readonly stackRef: StackRef;
  public readonly resourceConstructs: {
    resourceRef: ResourceRef;
    construct: Construct;
  }[] = [];
  private readonly regionStacks = new Map<string, Stack>();
  private readonly cdkApp: Construct;
  private readonly aediStackId: string;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: stackRef }: { resourceRef: StackRef },
  ) {
    super(scope, id, {
      crossRegionReferences: true,
      ...getAediCdkAppContext().defaultStackProps,
    });

    this.cdkApp = scope;
    this.aediStackId = id;
    this.stackRef = stackRef;
  }

  /**
   * Gets an alternative stack in another region for this stack.
   * Used when you need one or two constructs in a region other than the one you're deploying your application to.
   * For example, Cloudfront distribution certificates must be deployed to us-east-1.
   */
  getRegionStack(region: string): Stack {
    let stack = this.regionStacks.get(region);
    if (!stack) {
      stack = new Stack(this.cdkApp, `${this.aediStackId}-${region}`, {
        env: {
          account: this.account,
          region,
        },
        crossRegionReferences: true,
      });
      this.regionStacks.set(region, stack);
    }
    return stack;
  }

  registerResourceConstruct(resourceConstruct: {
    resourceRef: ResourceRef;
    construct: Construct;
  }) {
    this.resourceConstructs.push(resourceConstruct);
  }

  createMap() {
    new BucketDeployment(this, 'aedi-map-bucket-deployment', {
      sources: this.resourceConstructs.map(({ construct, resourceRef }) =>
        Source.jsonData(
          `${resourceRef.uid}.json`,
          (construct as any).getConstructRef?.() ?? {},
        ),
      ),
      destinationBucket: new Bucket(this, 'aedi-map-bucket', {
        bucketName: this.stackRef.mapBucketName,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });
  }
}

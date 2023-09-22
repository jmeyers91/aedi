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

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: stackRef }: { resourceRef: StackRef },
  ) {
    super(scope, id, {
      ...getAediCdkAppContext().defaultStackProps,
    });

    this.stackRef = stackRef;
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

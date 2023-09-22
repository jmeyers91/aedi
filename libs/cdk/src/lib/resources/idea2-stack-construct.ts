import { ResourceRef, StackRef } from '@aedi/common';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getIdea2CdkAppContext } from '../idea2-infra-utils';
import { Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BucketDeployment } from 'aws-cdk-lib/aws-s3-deployment';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class Idea2Stack extends Stack {
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
      ...getIdea2CdkAppContext().defaultStackProps,
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
    new BucketDeployment(this, 'idea2-map-bucket-deployment', {
      sources: this.resourceConstructs.map(({ construct, resourceRef }) =>
        Source.jsonData(
          `${resourceRef.uid}.json`,
          (construct as any).getConstructRef?.() ?? {},
        ),
      ),
      destinationBucket: new Bucket(this, 'idea2-map-bucket', {
        bucketName: this.stackRef.mapBucketName,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });
  }
}

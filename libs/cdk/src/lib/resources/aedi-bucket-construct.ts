import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { BucketConstructRef, BucketRef, RefType } from '@aedi/common';
import { ILambdaDependency } from '../aedi-infra-types';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { AediBaseConstruct } from '../aedi-base-construct';

export class AediBucket
  extends AediBaseConstruct<RefType.BUCKET>
  implements ILambdaDependency<BucketConstructRef>
{
  public readonly bucket: Bucket;
  public readonly bucketRef: BucketRef;

  constructor(scope: Construct, id: string, props: { resourceRef: BucketRef }) {
    super(scope, id, props);

    const bucketRef = (this.bucketRef = this.resourceRef);

    const bucket = new Bucket(this, 'bucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.bucket = bucket;

    // Deploy assets to the bucket if the asset path is set
    if (bucketRef.assetPath) {
      new BucketDeployment(this, 'deployment', {
        sources: [Source.asset(bucketRef.assetPath)],
        destinationBucket: bucket,
      });
    }
  }

  getConstructRef() {
    return {
      bucketName: this.bucket.bucketName,
      region: Stack.of(this).region,
    };
  }

  grantLambdaAccess(lambda: AediLambdaFunction): void {
    this.bucket.grantReadWrite(lambda.lambdaFunction);
  }
}

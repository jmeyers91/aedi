import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { createConstructName } from '../idea2-infra-utils';
import { BucketConstructRef, BucketRef } from '@sep6/idea2';
import { ILambdaDependency } from '../idea2-infra-types';
import { Idea2LambdaFunction } from './idea2-lambda-construct';

export class Idea2Bucket
  extends Construct
  implements ILambdaDependency<BucketConstructRef>
{
  public readonly bucket: Bucket;
  public readonly bucketRef: BucketRef;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: bucketRef }: { resourceRef: BucketRef }
  ) {
    super(scope, id);

    this.bucketRef = bucketRef;

    const bucket = new Bucket(this, 'bucket', {
      bucketName: createConstructName(this, bucketRef),
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

  grantLambdaAccess(lambda: Idea2LambdaFunction): void {
    this.bucket.grantReadWrite(lambda.lambdaFunction);
  }
}

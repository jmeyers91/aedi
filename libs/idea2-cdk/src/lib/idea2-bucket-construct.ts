import { RemovalPolicy, CfnOutput, Stack } from 'aws-cdk-lib';
import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { createConstructName, getIdea2StackContext } from './idea2-infra-utils';
import { BucketRef, RefType } from '@sep6/idea2';

export class Idea2Bucket extends Construct {
  static cachedFactory(scope: Construct, bucketRef: BucketRef): Idea2Bucket {
    const cache = getIdea2StackContext(scope).getCache<Idea2Bucket>(
      RefType.BUCKET
    );
    const cached = cache.get(bucketRef.id);
    if (cached) {
      return cached;
    }
    const bucket = new Idea2Bucket(Stack.of(scope), `bucket-${bucketRef.id}`, {
      bucketRef,
    });
    cache.set(bucketRef.id, bucket);
    return bucket;
  }

  public readonly bucket: Bucket;

  constructor(
    scope: Construct,
    id: string,
    { bucketRef }: { bucketRef: BucketRef }
  ) {
    super(scope, id);

    const bucket = new Bucket(this, bucketRef.id, {
      bucketName: createConstructName(this, bucketRef.id),
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.bucket = bucket;

    // Deploy assets to the bucket if the asset path is set
    if (bucketRef.assetPath) {
      let distribution: Distribution | undefined = undefined;

      if (bucketRef.domain) {
        const originAccessIdentity = new OriginAccessIdentity(
          this,
          'access-identity'
        );

        bucket.grantRead(originAccessIdentity);

        // TODO: Add DNS support
        distribution = new Distribution(this, 'distribution', {
          defaultBehavior: {
            origin: new S3Origin(bucket, { originAccessIdentity }),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
          defaultRootObject: 'index.html',
          errorResponses: [
            {
              httpStatus: 404,
              responseHttpStatus: 200,
              responsePagePath: '/index.html',
            },
          ],
        });

        new CfnOutput(this, 'bucket-url', {
          description: `URL for bucket distribution: ${bucketRef.id}`,
          value: `https://${distribution.domainName}`,
        });
      }

      new BucketDeployment(this, 'deployment', {
        sources: [Source.asset(bucketRef.assetPath)],
        destinationBucket: bucket,
        distribution,
      });
    }
  }
}

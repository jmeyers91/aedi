import { CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class WebApp extends Construct {
  public readonly distribution;

  constructor(
    scope: Construct,
    id: string,
    {
      distPath,
      clientConfig,
    }: { distPath: string; clientConfig?: Record<string, unknown> }
  ) {
    super(scope, id);

    const bucket = new Bucket(this, 'bucket', {
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      bucketName: `web-app-${id}`,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'access-identity'
    );

    bucket.grantRead(originAccessIdentity);

    this.distribution = new Distribution(this, 'distribution', {
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

    new BucketDeployment(this, 'deployment', {
      sources: [
        Source.asset(distPath),
        ...(clientConfig
          ? [
              Source.data(
                `client-config.js`,
                // prettier-ignore
                `(() => {(globalThis ?? window).__clientConfig = ${JSON.stringify(clientConfig)}; })();`
              ),
            ]
          : []),
      ],
      destinationBucket: bucket,
      distribution: this.distribution,
    });

    new CfnOutput(this, 'url', {
      value: `https://${this.distribution.domainName}`,
      description: 'The distribution URL',
      exportName: `${Stack.of(this).stackName}-CloudfrontURL`,
    });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import { ILambdaDependency } from '../idea2-infra-types';
import { StaticSiteConstructRef, StaticSiteRef } from '@sep6/idea2';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  OriginAccessIdentity,
  Distribution,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';

export class Idea2StaticSite
  extends Construct
  implements ILambdaDependency<StaticSiteConstructRef>
{
  public readonly staticSiteRef;
  public readonly bucket: Bucket;
  public readonly distribution: Distribution;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: staticSiteRef }: { resourceRef: StaticSiteRef<any> }
  ) {
    super(scope, id);

    this.staticSiteRef = staticSiteRef;

    this.bucket = new Bucket(this, 'bucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'access-identity'
    );

    this.bucket.grantRead(originAccessIdentity);

    this.distribution = new Distribution(this, 'distribution', {
      defaultBehavior: {
        origin: new S3Origin(this.bucket, { originAccessIdentity }),
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

    new BucketDeployment(this, 'bucket-deployment', {
      sources: [Source.asset(staticSiteRef.assetPath)],
      destinationBucket: this.bucket,
      distribution: this.distribution,
    });
  }

  getConstructRef() {
    return {
      url: `https://${this.distribution.domainName}`,
    };
  }

  grantLambdaAccess() {
    // No special permissions needed to grant lambda functions access to static sites
  }
}

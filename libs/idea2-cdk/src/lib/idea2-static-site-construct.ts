import { Construct } from 'constructs';
import { ILambdaDependency } from './idea2-infra-types';
import { StaticSiteConstructRef, StaticSiteRef } from '@sep6/idea2';
import { CfnOutput } from 'aws-cdk-lib';
import {
  OriginAccessIdentity,
  Distribution,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Idea2Bucket } from './idea2-bucket-construct';
import { resolveConstruct } from './idea2-infra-utils';

export class Idea2StaticSite
  extends Construct
  implements ILambdaDependency<StaticSiteConstructRef>
{
  public readonly staticSiteRef;
  public readonly distribution?: Distribution;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: staticSiteRef }: { resourceRef: StaticSiteRef }
  ) {
    super(scope, id);

    this.staticSiteRef = staticSiteRef;
  }

  getBucketDistribution({
    bucket,
    bucketRef,
  }: Pick<Idea2Bucket, 'bucket' | 'bucketRef'>) {
    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'access-identity'
    );

    bucket.grantRead(originAccessIdentity);

    // TODO: Add DNS support
    const distribution = new Distribution(this, 'distribution', {
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

    return distribution;
  }

  getConstructRef() {
    if (this.staticSiteRef.bucket && !this.distribution) {
      // Resolve the dependent bucket if it hasn't been resolved already
      // This ensures the distribution URL is populated
      resolveConstruct(this, this.staticSiteRef.bucket);
    }
    if (!this.distribution) {
      throw new Error(
        `Distribution is missing despite bucket reference existing.`
      );
    }

    return {
      url: `https://${this.distribution.domainName}`,
    };
  }

  grantLambdaAccess() {
    // No special permissions needed to grant lambda functions access to static sites
  }
}

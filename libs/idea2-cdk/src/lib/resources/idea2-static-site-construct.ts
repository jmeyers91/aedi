import { Construct } from 'constructs';
import { ILambdaDependency } from '../idea2-infra-types';
import { RefType, StaticSiteConstructRef, StaticSiteRef } from '@sep6/idea2';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  OriginAccessIdentity,
  Distribution,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  BucketDeployment,
  ISource,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment';
import { Idea2BaseConstruct } from '../idea2-base-construct';

export class Idea2StaticSite
  extends Idea2BaseConstruct<RefType.STATIC_SITE>
  implements ILambdaDependency<StaticSiteConstructRef>
{
  public readonly staticSiteRef;
  public readonly bucket: Bucket;
  public readonly distribution: Distribution;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: StaticSiteRef<any> }
  ) {
    super(scope, id, props);

    const staticSiteRef = (this.staticSiteRef = this.resourceRef);

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

    const bucketDeploymentSources: ISource[] = [
      Source.asset(staticSiteRef.assetPath),
    ];

    new BucketDeployment(this, 'bucket-deployment', {
      sources: bucketDeploymentSources,
      destinationBucket: this.bucket,
      distribution: this.distribution,
    });
  }

  getConstructRef() {
    return {
      region: Stack.of(this).region,
      bucketName: this.bucket.bucketName,
      url: `https://${this.distribution.domainName}`,
    };
  }

  grantLambdaAccess() {
    // No special permissions needed to grant lambda functions access to static sites
  }
}

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { debug } from '../utils/debug';
import { CertifiedDomain } from './dns-manager';

export class WebApp extends Construct {
  public readonly distribution;

  constructor(
    scope: Construct,
    id: string,
    {
      distPath,
      clientConfig,
      dns,
    }: {
      distPath: string;
      clientConfig?: Record<string, unknown>;
      dns?: CertifiedDomain;
    }
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

      ...(dns
        ? {
            domainNames: [dns.domainPair.domainName],
            certificate: dns.certificate,
          }
        : {}),
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
      value: `https://${
        dns ? dns.domainPair.domainName : this.distribution.domainName
      }`,
    });

    if (dns) {
      new ARecord(this, 'ARecord', {
        recordName: dns.domainPair.domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        zone: dns.hostedZone,
      });
      debug(`[A-Record] ${dns.domainPair.domainName} -> ${id}`);
    }
  }
}

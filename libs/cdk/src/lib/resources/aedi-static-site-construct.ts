import { Construct } from 'constructs';
import { ILambdaDependency } from '../aedi-infra-types';
import {
  RefType,
  StaticSiteConstructRef,
  StaticSiteRef,
  isBehavior,
} from '@aedi/common';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  OriginAccessIdentity,
  Distribution,
  ViewerProtocolPolicy,
  CachePolicy,
  AllowedMethods,
  OriginRequestPolicy,
  DistributionProps,
} from 'aws-cdk-lib/aws-cloudfront';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { AediBaseConstruct } from '../aedi-base-construct';
import {
  NotReadOnly,
  fromEnumKey,
  getRegionStack,
  resolveConstruct,
} from '../aedi-infra-utils';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  ARecord,
  PublicHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { ClientConfigProvider } from '../constructs/client-config-provider/client-config-provider';

export class AediStaticSite
  extends AediBaseConstruct<RefType.STATIC_SITE>
  implements ILambdaDependency<StaticSiteConstructRef>
{
  public readonly staticSiteRef;
  public readonly bucket: Bucket;
  public readonly distribution: Distribution;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: StaticSiteRef<any> },
  ) {
    super(scope, id, props);

    const staticSiteRef = (this.staticSiteRef = this.resourceRef);

    this.bucket = new Bucket(this, 'bucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'access-identity',
    );

    this.bucket.grantRead(originAccessIdentity);

    const distributionProps: NotReadOnly<DistributionProps> = {
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
    };

    // Add the domain name and certificate to the distribution
    if (staticSiteRef.domain) {
      const usEast1Stack = getRegionStack(this, 'us-east-1'); // Cloudfront distribution certs must be in us-east-1
      const certId = `${staticSiteRef.uid.split('.').join('-')}-domain-cert`;
      const hostedZoneId = `${staticSiteRef.uid
        .split('.')
        .join('-')}-domain-zone`;
      distributionProps.domainNames = [staticSiteRef.domain.name];
      distributionProps.certificate = new Certificate(usEast1Stack, certId, {
        domainName: staticSiteRef.domain.name,
        validation: CertificateValidation.fromDns(
          PublicHostedZone.fromLookup(usEast1Stack, hostedZoneId, {
            domainName: staticSiteRef.domain.zone,
          }),
        ),
      });
    }

    this.distribution = new Distribution(
      this,
      'distribution',
      distributionProps,
    );

    // Create an A-record pointing from the domain to the distribution
    if (staticSiteRef.domain) {
      new ARecord(this, 'ARecord', {
        recordName: staticSiteRef.domain.name,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        zone: PublicHostedZone.fromLookup(this, 'domain-hosted-zone', {
          domainName: staticSiteRef.domain.zone,
        }),
      });
    }

    const sources = [Source.asset(staticSiteRef.assetPath)];

    if (this.resourceRef.clientConfig) {
      sources.push(
        new ClientConfigProvider(this, 'client-config-provider', {
          staticSiteRef: this.resourceRef,
        }),
      );
    }

    for (const behavior of Object.values(this.resourceRef.clientConfig)) {
      if (!isBehavior(behavior)) continue;

      const { behaviorRef, behaviorOptions } = behavior;

      // TODO: Move the logic for adding these behaviors into the individual constructs using an interface
      /**
       * TODO: The default values for these behavior options should be clearly defined somewhere.
       * They're different for each behavior type because they can be very confusing and difficult to
       * configure correctly, and ideally all of the behavior types have reasonable defaults that
       * behave in a way a developer expects without being too permissive.
       */
      if (behaviorRef.type === RefType.REST_API) {
        const restApi = resolveConstruct(behaviorRef);

        this.distribution.addBehavior(
          behaviorOptions.path,
          new RestApiOrigin(restApi.restApi),
          {
            viewerProtocolPolicy: fromEnumKey(
              ViewerProtocolPolicy,
              behaviorOptions.viewerProtocolPolicy,
              'REDIRECT_TO_HTTPS',
            ),
            cachePolicy: fromEnumKey(
              CachePolicy,
              behaviorOptions.cachePolicy,
              'CACHING_DISABLED',
            ),
            allowedMethods: fromEnumKey(
              AllowedMethods,
              behaviorOptions.allowedMethods,
              'ALLOW_ALL',
            ),
            originRequestPolicy: fromEnumKey(
              OriginRequestPolicy,
              behaviorOptions.originRequestPolicy,
              'ALL_VIEWER_EXCEPT_HOST_HEADER',
            ),
          },
        );
      } else if (behaviorRef.type === RefType.BUCKET) {
        const { bucket } = resolveConstruct(behaviorRef);

        this.distribution.addBehavior(
          behaviorOptions.path,
          new S3Origin(bucket),
          {
            viewerProtocolPolicy: fromEnumKey(
              ViewerProtocolPolicy,
              behaviorOptions.viewerProtocolPolicy,
              'REDIRECT_TO_HTTPS',
            ),
            cachePolicy: fromEnumKey(
              CachePolicy,
              behaviorOptions.cachePolicy,
              'CACHING_OPTIMIZED',
            ),
            allowedMethods: fromEnumKey(
              AllowedMethods,
              behaviorOptions.allowedMethods,
              'ALLOW_GET_HEAD',
            ),
            originRequestPolicy: behaviorOptions.originRequestPolicy
              ? OriginRequestPolicy[behaviorOptions.originRequestPolicy]
              : undefined,
          },
        );
      } else {
        throw new Error(
          `Unsupported rest API behavior target type: ${behaviorRef.type}`,
        );
      }
    }

    new BucketDeployment(this, 'bucket-deployment', {
      sources,
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

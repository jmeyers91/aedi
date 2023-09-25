import { Construct } from 'constructs';
import { ILambdaDependency } from '../aedi-infra-types';
import {
  GENERATED,
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
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { InlineCode, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import {
  NotReadOnly,
  fromEnumKey,
  getMode,
  getRegionStack,
  isResourceRef,
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
    if (staticSiteRef.domain && staticSiteRef.domain !== GENERATED) {
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
    if (staticSiteRef.domain && staticSiteRef.domain !== GENERATED) {
      new ARecord(this, 'ARecord', {
        recordName: staticSiteRef.domain.name,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        zone: PublicHostedZone.fromLookup(this, 'domain-hosted-zone', {
          domainName: staticSiteRef.domain.zone,
        }),
      });
    }

    // Add the client config API to host the client config script
    if (this.resourceRef.clientConfig) {
      this.distribution.addBehavior(
        '/aedi/client-config.js',
        new RestApiOrigin(
          new StaticSiteConfigApi(this, 'config-api', {
            staticSiteRef,
          }).restApi,
        ),
        {
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CachePolicy.CACHING_DISABLED,
        },
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
      sources: [Source.asset(staticSiteRef.assetPath)],
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

/**
 * An API Gateway REST API that returns the client config script for a static site.
 * This API is only created if the `clientConfig` option is used in the static site.
 *
 * Note: A lambda is used here because it is the only construct that can resolve cross-stack
 * construct references. S3 asset sources can only reference constructs in their stack, so adding
 * an additional source to the bucket doesn't work.
 */
class StaticSiteConfigApi extends Construct {
  public readonly restApi;

  constructor(
    scope: Construct,
    id: string,
    { staticSiteRef }: { staticSiteRef: StaticSiteRef<any> },
  ) {
    super(scope, id);

    const resolvedConfig: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      staticSiteRef.clientConfig ?? {},
    )) {
      if (isResourceRef(value)) {
        const construct = resolveConstruct(value);
        if ('getConstructRef' in construct) {
          resolvedConfig[key] = construct.getConstructRef();
        } else if (isBehavior(value)) {
          const construct = resolveConstruct(value.behaviorRef);
          if ('getConstructRef' in construct) {
            resolvedConfig[key] = construct.getConstructRef();
          }
        } else {
          resolvedConfig[key] = {};
        }
      } else {
        resolvedConfig[key] = value;
      }
    }

    // This script is run in the static site global scope
    const clientConfigScript = `
        window.__clientConfig = ${JSON.stringify(resolvedConfig, null, 2)};
        ${
          getMode() === 'development'
            ? `console.log("${staticSiteRef.uid} config", window.__clientConfig);`
            : ''
        }
    `;

    const lambdaSrc = `"use strict";
    module.exports.handler = async () => ({
      statusCode: 200,
      body: \`${clientConfigScript}\`,
      headers: {
        'Content-Type': 'application/javascript',
      },
     });`;

    /**
     * This lambda responds with a JS script that injects the resolved client config into the global scope
     * of the static site. This makes the resolved client config available for access using the `@aedi/browser-client` library.
     */
    const getClientConfigLambda = new Function(this, 'config-lambda', {
      code: new InlineCode(lambdaSrc),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_18_X,
    });

    const restApi = new RestApi(this, 'api', {
      defaultCorsPreflightOptions: {
        allowCredentials: true,
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });
    this.restApi = restApi;

    this.restApi.root
      .addResource('{proxy+}')
      .addMethod('GET', new LambdaIntegration(getClientConfigLambda));
  }
}

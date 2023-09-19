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
import {
  BucketDeployment,
  ISource,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment';
import { isResourceRef, resolveConstruct } from '../idea2-infra-utils';

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

    const bucketDeploymentSources: ISource[] = [
      Source.asset(staticSiteRef.assetPath),
    ];

    if (staticSiteRef.clientConfig) {
      const resolvedClientConfig: Record<string, unknown> = {};

      /**
       * Resolve resources that are referenced in the static site client config in order to provide their
       * construct refs to the client app via a script injected into the distribution bucket.
       * Non-resource client config entries are passed to the client as-is.
       */
      for (const [key, value] of Object.entries(staticSiteRef.clientConfig)) {
        if (isResourceRef(value)) {
          const refConstruct = resolveConstruct(value);

          if ('getConstructRef' in refConstruct) {
            resolvedClientConfig[key] = refConstruct.getConstructRef();
          } else {
            throw new Error(
              `Unable to provide resource type ${value.type} to a static site.`
            );
          }
        } else {
          // Non-resource ref values are passed to the client as-is
          resolvedClientConfig[key] = value;
        }
      }

      bucketDeploymentSources.push(
        Source.data(
          staticSiteRef.clientConfigFilename ?? `client-config.js`,
          // prettier-ignore
          `(() => {(globalThis ?? window).__clientConfig = ${JSON.stringify(resolvedClientConfig)}; })();`
        )
      );
    }

    new BucketDeployment(this, 'bucket-deployment', {
      sources: bucketDeploymentSources,
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

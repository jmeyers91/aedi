import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  BucketDeployment,
  ISource,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import {
  BucketConstructRef,
  BucketRef,
  RefType,
  StaticSiteBehaviorOptions,
  isTypescriptAsset,
} from '@aedi/common';
import {
  ICloudfrontBehaviorSource,
  IComputeDependency,
} from '../aedi-infra-types';
import { AediBaseConstruct } from '../aedi-base-construct';
import { fromEnumKey, getMode } from '../aedi-infra-utils';
import { TypeScriptSource } from '@mrgrain/cdk-esbuild';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

export class AediBucket
  extends AediBaseConstruct<RefType.BUCKET>
  implements IComputeDependency<BucketConstructRef>, ICloudfrontBehaviorSource
{
  public readonly bucket: Bucket;
  public readonly bucketRef: BucketRef;

  constructor(scope: Construct, id: string, props: { resourceRef: BucketRef }) {
    super(scope, id, props);

    const bucketRef = (this.bucketRef = this.resourceRef);
    const defaultRemovalPolicy =
      getMode() === 'production' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    const bucket = new Bucket(this, 'bucket', {
      autoDeleteObjects: true,
      removalPolicy: defaultRemovalPolicy,
    });
    this.bucket = bucket;

    const sources: ISource[] = [];

    if (typeof bucketRef.assetPath === 'string') {
      sources.push(Source.asset(bucketRef.assetPath));
    } else if (isTypescriptAsset(bucketRef.assetPath)) {
      const { typescriptAssetPath, ...rest } = bucketRef.assetPath;
      sources.push(new TypeScriptSource(typescriptAssetPath, rest));
    }

    // Deploy assets to the bucket if the asset path is set
    if (bucketRef.assetPath) {
      new BucketDeployment(this, 'deployment', {
        sources,
        destinationBucket: bucket,
      });
    }
  }

  addCloudfrontBehavior(
    distribution: Distribution,
    options: StaticSiteBehaviorOptions,
  ): void {
    distribution.addBehavior(options.path, new S3Origin(this.bucket), {
      viewerProtocolPolicy: fromEnumKey(
        ViewerProtocolPolicy,
        options.viewerProtocolPolicy,
        'REDIRECT_TO_HTTPS',
      ),
      cachePolicy: fromEnumKey(
        CachePolicy,
        options.cachePolicy,
        'CACHING_OPTIMIZED',
      ),
      allowedMethods: fromEnumKey(
        AllowedMethods,
        options.allowedMethods,
        'ALLOW_GET_HEAD',
      ),
      originRequestPolicy: options.originRequestPolicy
        ? OriginRequestPolicy[options.originRequestPolicy]
        : undefined,
    });
  }

  getConstructRef() {
    return {
      bucketName: this.bucket.bucketName,
      region: Stack.of(this).region,
    };
  }

  grantComputeAccess(grantable: IGrantable): void {
    this.bucket.grantReadWrite(grantable);
  }
}

import { Construct } from 'constructs';
import * as synchronizedPrettier from '@prettier/sync';
import { ILambdaDependency } from '../idea2-infra-types';
import {
  RefType,
  RestApiRef,
  RestApiRefRoute,
  StaticSiteConstructRef,
  StaticSiteRef,
  isBodyDependency,
  isQueryParamsDependency,
  isStaticSiteApiClientGenerator,
  resolveRef,
} from '@aedi/idea2';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  OriginAccessIdentity,
  Distribution,
  ViewerProtocolPolicy,
  CachePolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  BucketDeployment,
  ISource,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment';
import { Idea2BaseConstruct } from '../idea2-base-construct';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { InlineCode, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { getMode, isResourceRef, resolveConstruct } from '../idea2-infra-utils';

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

    // Add the client config API to host the client config script
    if (this.resourceRef.clientConfig) {
      this.distribution.addBehavior(
        '/idea2/client-config.js',
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
    const apiClients: { key: string; clientSrc: string }[] = [];

    for (const [key, value] of Object.entries(
      staticSiteRef.clientConfig ?? {},
    )) {
      if (isResourceRef(value)) {
        const construct = resolveConstruct(value);
        if ('getConstructRef' in construct) {
          resolvedConfig[key] = construct.getConstructRef();
        } else {
          resolvedConfig[key] = {};
        }
      } else if (isStaticSiteApiClientGenerator(value)) {
        apiClients.push({
          key,
          clientSrc: generateRestApiClient(value.restApiRef),
        });
      } else {
        resolvedConfig[key] = value;
      }
    }

    // TODO: Move all this shit out of this file
    // Maybe a proper templating system for rendering clients for refs?

    // This script is run in the static site
    const clientConfigScript = `
      window.__clientConfig = {
        ...___RESOLVED_CONFIG___,

        ${apiClients
          .map(({ key, clientSrc }) => `${key}: ${clientSrc}`)
          .join(',\n\n')}
      };

      ${
        getMode() === 'development'
          ? `console.log("${staticSiteRef.uid} config", window.__clientConfig);`
          : ''
      }
    `;

    const lambdaSrc = `"use strict";
    module.exports.handler = async () => ({
      statusCode: 200,
      body: \`${synchronizedPrettier
        .format(clientConfigScript, {
          parser: 'babel',
        })
        .replace(/(\`|(?:\$\{))/gm, '\\$1') // Escape back-ticks and "${" because this code is wrapped in a string.
        .replace(
          '___RESOLVED_CONFIG___',
          JSON.stringify(resolvedConfig, null, 2).replace(/\n/g, '\n  '),
        )}\`,
      headers: {
        'Content-Type': 'application/javascript',
      },
     });`;

    /**
     * This lambda responds with a JS script that injects the resolved client config into the global scope
     * of the static site. This makes the resolved client config available for access using the `idea2-browser-client` library.
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

function generateRestApiClient(restApi: RestApiRef): string {
  resolveConstruct;
  return `({ baseUrl, getHeaders }) => ({
    ${restApi.routes
      .map(
        (routeDef) =>
          `${routeDef.lambdaRef.id}: ${generateRestApiRouteClient(routeDef)}`,
      )
      .join(',\n\n')}
  })`;
}

function generateRestApiRouteClient(routeDef: RestApiRefRoute) {
  const bodySchema = findBodySchema(routeDef);
  const queryParamSchema = findQueryParamSchema(routeDef);

  let pathInputKeys: string[] = [];
  const renderedPath = routeDef.path
    .split('/')
    .filter((it) => it.length > 0)
    .map((part) => {
      let variableMatch = part.match(/\{(.+?)\+?\}/);

      if (variableMatch) {
        const pathInputKey = variableMatch[1];
        pathInputKeys.push(pathInputKey);
        return `\${${pathInputKey}}`;
      }

      return part;
    })
    .join('/');

  const bodyInputKeys = bodySchema?.properties
    ? Object.keys(bodySchema.properties)
    : [];
  const queryParamInputKeys = queryParamSchema?.properties
    ? Object.keys(queryParamSchema.properties)
    : [];
  const inputKeys = Array.from(
    new Set([...pathInputKeys, ...bodyInputKeys, ...queryParamInputKeys]),
  );

  return `async (${
    inputKeys.length > 0 ? `{ ${inputKeys.join(', ')} }` : ''
  }) => {
    const url = new URL(\`\${baseUrl}/${renderedPath}\`);
    ${queryParamInputKeys
      .map(
        (key) =>
          `if (${key} !== undefined) { url.searchParams.append("${key}", ${key}); }`,
      )
      .join('\n')}
    const response = await fetch(url, {
      method: "${routeDef.method}",
      headers: {
        "Content-Type": "application/json",
        ...(await getHeaders?.()),
      },
      ${
        bodyInputKeys.length > 0
          ? `body: JSON.stringify({ ${bodyInputKeys.join(', ')} }),`
          : ''
      }
    });
    return response.json();
  }`;
}

function findBodySchema(routeDef: RestApiRefRoute) {
  return Object.values(routeDef.lambdaRef.context).find(isBodyDependency)
    ?.bodySchema;
}

function findQueryParamSchema(routeDef: RestApiRefRoute) {
  return Object.values(routeDef.lambdaRef.context).find(isQueryParamsDependency)
    ?.queryParamSchema;
}

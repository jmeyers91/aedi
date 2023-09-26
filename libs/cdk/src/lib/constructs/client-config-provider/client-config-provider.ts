import { Duration, CustomResource } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  DeploymentSourceContext,
  ISource,
  Source,
  SourceConfig,
} from 'aws-cdk-lib/aws-s3-deployment';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { isResourceRef, resolveConstruct } from '../../aedi-infra-utils';
import { StaticSiteRef, isBehavior } from '@aedi/common';

/**
 * Takes the static site resource and transforms its client config into a script that can be injected into
 * the static site's bucket to provide the resolved client config to the static site as `window.__clientConfig` once loaded.
 */
export class ClientConfigProvider extends Construct implements ISource {
  public readonly clientConfigSource: ISource;

  constructor(
    scope: Construct,
    id: string,
    {
      staticSiteRef,
    }: {
      staticSiteRef: StaticSiteRef<any>;
    },
  ) {
    super(scope, id);

    const lambda = new NodejsFunction(this, 'lambda', {
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
    });
    lambda.addEnvironment('AWS_NODEJS_CONNECTION_REUSE_ENABLED', '1', {
      removeInEdge: true,
    });

    const provider = new Provider(this, 'resource-provider', {
      onEventHandler: lambda,
    });

    /**
     * A custom resource is needed because cross-stack references can't be rendered in
     * an S3 deployment source templates, but custom resources can receive and return
     * cross stack references, so all we have to do is pass the references through a
     * custom resource before rendering them as a source.
     */
    const customResource = new CustomResource(this, 'custom-resource', {
      serviceToken: provider.serviceToken,
      properties: {
        value: this.resolveConfig(staticSiteRef),
      },
    });

    this.clientConfigSource = Source.data(
      '/aedi/client-config.js',
      `window.__clientConfig = ${customResource.getAttString('Result')};
       console.log('Client config loaded', window.__clientConfig);
      `,
    );
  }

  bind(
    scope: Construct,
    context?: DeploymentSourceContext | undefined,
  ): SourceConfig {
    return this.clientConfigSource.bind(scope, context);
  }

  private resolveConfig(staticSiteRef: StaticSiteRef<any>) {
    const resolvedConfig: Record<string, unknown> = {};

    for (let [key, value] of Object.entries(staticSiteRef.clientConfig ?? {})) {
      if (isBehavior(value)) {
        value = value.behaviorRef;
      }
      if (isResourceRef(value)) {
        const construct = resolveConstruct(value);
        if ('getConstructRef' in construct) {
          resolvedConfig[key] = construct.getConstructRef();
        } else {
          resolvedConfig[key] = {};
        }
      } else {
        resolvedConfig[key] = value;
      }
    }

    return resolvedConfig;
  }
}

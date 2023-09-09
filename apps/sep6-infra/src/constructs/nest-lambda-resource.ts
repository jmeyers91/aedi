import {
  MergedNestResourceNode,
  NestResourceNode,
  ResourceType,
} from '@sep6/utils';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface Props
  extends Omit<
    NodejsFunctionProps,
    'functionName' | 'runtime' | 'entry' | 'handler' | 'bundling'
  > {
  envName: string;
  lambdaResourceGroup: MergedNestResourceNode<ResourceType.LAMBDA_FUNCTION>;
  corsOrigins: string[] | null;
}

export class NestLambdaResource extends NodejsFunction {
  constructor(
    scope: Construct,
    id: string,
    { envName, lambdaResourceGroup, corsOrigins, ...props }: Props
  ) {
    const lambdaResource =
      findLambdaResourceWithControllers(lambdaResourceGroup);

    super(scope, id, {
      ...props,
      functionName: `${envName}-${lambdaResource.name}`,
      runtime: Runtime.NODEJS_18_X,
      entry: lambdaResource.resourceMetadata.handlerFilePath,
      handler: `index.${lambdaResource.name}.lambdaHandler`,
      timeout: Duration.seconds(15),
      bundling: {
        externalModules: [
          '@nestjs/microservices',
          '@nestjs/websockets/socket-module',
        ],
      },
      environment: {
        ...props.environment,
        ENV_NAME: envName,
        ...(corsOrigins
          ? {
              CORS_ORIGINS: JSON.stringify(corsOrigins),
            }
          : {}),
      },
    });
  }
}

function findLambdaResourceWithControllers(
  lambdaResourceGroup: MergedNestResourceNode<ResourceType.LAMBDA_FUNCTION>
): NestResourceNode<ResourceType.LAMBDA_FUNCTION> {
  const lambdaResourcesWithControllers =
    lambdaResourceGroup.resourceNodes.filter(
      (node) => node.controllers.length > 0
    );

  if (lambdaResourcesWithControllers.length !== 1) {
    throw new Error(
      `Ambiguous lambda module - a lambda module can only be registered with controllers once in the Nest module tree.`
    );
  }
  const [lambdaResource] = lambdaResourcesWithControllers;

  if (!lambdaResource) {
    console.log(JSON.stringify(lambdaResourceGroup));
    throw new Error(
      `Unable to find static lambda node: ${lambdaResourceGroup.mergedMetadata.id}`
    );
  }

  return lambdaResource;
}

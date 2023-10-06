import { Construct } from 'constructs';
import { resolveConstruct } from '../aedi-infra-utils';
import { Duration, Stack } from 'aws-cdk-lib';
import {
  ClientRef,
  AediAppHandlerEnv,
  FargateServiceConstructRef,
  getClientRefFromRef,
  FargateServiceDependencyGroup,
  RefType,
  AnyFargateServiceRef,
} from '@aedi/common';
import { ILambdaDependency } from '../aedi-infra-types';
import { AediBaseConstruct } from '../aedi-base-construct';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import {
  ContainerDefinition,
  ContainerImage,
  FargateTaskDefinition,
} from 'aws-cdk-lib/aws-ecs';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Protocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class AediFargateService
  extends AediBaseConstruct<RefType.FARGATE_SERVICE>
  implements ILambdaDependency<FargateServiceConstructRef>
{
  public readonly fargateServiceRef: AnyFargateServiceRef;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: AnyFargateServiceRef },
  ) {
    super(scope, id, props);

    const fargateServiceRef = (this.fargateServiceRef = this.resourceRef);

    const dependencies: {
      clientRef: ClientRef;
      construct: ILambdaDependency<any> | Construct;
    }[] = [];
    const environment: Omit<AediAppHandlerEnv, 'AEDI_CONSTRUCT_UID_MAP'> &
      Record<`AEDI_REF_${string}`, string> = {
      AEDI_FUNCTION_ID: fargateServiceRef.id,
      AEDI_FUNCTION_UID: fargateServiceRef.uid,
    };

    // Collect dependencies from the lambda context refs
    for (const contextValue of Object.values(
      fargateServiceRef.context as FargateServiceDependencyGroup,
    )) {
      // Ignore event transforms here - they're only relevant at runtime and require no additional permissions or construct refs
      if ('transformEvent' in contextValue) {
        continue;
      }
      const clientRef = getClientRefFromRef(contextValue);
      const ref = clientRef.ref;
      const construct = resolveConstruct(ref);

      if (construct) {
        if ('getConstructRef' in construct) {
          const envKey = `AEDI_REF_${ref.uid
            .replace(/-/g, '_')
            .replace(/\./g, '__')}` as const;
          const constructRef = construct.getConstructRef();

          environment[envKey] =
            typeof constructRef === 'string'
              ? constructRef
              : JSON.stringify(construct.getConstructRef());
        }

        dependencies.push({ construct, clientRef });
      }
    }

    if (!fargateServiceRef.handlerLocation) {
      throw new Error(
        `Unable to resolve lambda handler location: ${fargateServiceRef.uid}`,
      );
    }

    const port = 4200;
    const vpc = new Vpc(this, 'vpc', {
      maxAzs: 2,
    });

    // TODO: Create
    const tempBuildDir = resolve(tmpdir(), randomUUID());
    mkdirSync(tempBuildDir);
    execSync(
      `npx esbuild "${
        fargateServiceRef.filepath
      }" --bundle --platform=node --outfile="${resolve(
        tempBuildDir,
        'index.js',
      )}"`,
    );
    writeFileSync(
      resolve(tempBuildDir, 'Dockerfile'),
      [
        `FROM --platform=linux/amd64 node:18`,
        `WORKDIR /usr/src/app`,
        `COPY . .`,
        `EXPOSE ${port}`,
        `CMD [ "node", "index.js" ]`,
      ].join('\n'),
    );
    console.log('>>>>>> tempBuildDir', tempBuildDir);

    const taskDefinition = new FargateTaskDefinition(this, 'task-definition', {
      cpu: 1024,
      memoryLimitMiB: 2048,
    });

    const containerDefinition = new ContainerDefinition(
      this,
      'container-definition',
      {
        taskDefinition: taskDefinition,
        image: ContainerImage.fromDockerImageAsset(
          new DockerImageAsset(this, 'container-image', {
            directory: tempBuildDir,
          }),
        ),
        portMappings: [
          {
            containerPort: port,
          },
        ],
        environment: {
          PORT: port.toString(),
          AEDI_FARGATE_EXECUTE_SERVICE_UID: fargateServiceRef.uid,
        },
        healthCheck: {
          command: [
            'CMD-SHELL',
            `curl -f http://localhost:${port}/api/healthcheck || exit 1`,
          ],
        },
      },
    );

    taskDefinition.defaultContainer = containerDefinition;

    const securityGroup = new SecurityGroup(this, 'security-group', {
      vpc,
      allowAllOutbound: true,
    });

    const loadBalancedFargateService =
      new ApplicationLoadBalancedFargateService(this, 'alb-fargate-service', {
        vpc,
        desiredCount: 1,
        securityGroups: [securityGroup],
        taskDefinition,
        listenerPort: port,
        healthCheckGracePeriod: Duration.seconds(10),
        circuitBreaker: {
          rollback: true,
        },
      });

    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: '/api/healthcheck',
    });
  }

  getConstructRef() {
    return {
      region: Stack.of(this).region,
    };
  }

  grantLambdaAccess(lambda: AediLambdaFunction): void {
    // TODO?
  }
}

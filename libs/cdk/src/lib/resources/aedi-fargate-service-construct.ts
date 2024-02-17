import { Construct } from 'constructs';
import {
  NotReadOnly,
  createComputeDependencyEnv,
  fromEnumKey,
  getRegionStack,
  resolveConstruct,
} from '../aedi-infra-utils';
import { Duration, Stack } from 'aws-cdk-lib';
import {
  FargateServiceConstructRef,
  RefType,
  AnyFargateServiceRef,
  StaticSiteBehaviorOptions,
} from '@aedi/common';
import {
  ICloudfrontBehaviorSource,
  IComputeDependency,
} from '../aedi-infra-types';
import { AediBaseConstruct } from '../aedi-base-construct';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import {
  ApplicationLoadBalancedFargateService,
  ApplicationLoadBalancedFargateServiceProps,
} from 'aws-cdk-lib/aws-ecs-patterns';
import {
  ContainerDefinition,
  ContainerImage,
  FargateService,
  FargateServiceProps,
  FargateTaskDefinition,
} from 'aws-cdk-lib/aws-ecs';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import {
  Connections,
  IConnectable,
  Port,
  SecurityGroup,
} from 'aws-cdk-lib/aws-ec2';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  DistributionProps,
  OriginProtocolPolicy,
  OriginRequestPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import {
  HttpOrigin,
  LoadBalancerV2Origin,
} from 'aws-cdk-lib/aws-cloudfront-origins';
import { DnsRecordType, Service } from 'aws-cdk-lib/aws-servicediscovery';
import {
  ARecord,
  IHostedZone,
  PublicHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  CloudFrontTarget,
  LoadBalancerTarget,
} from 'aws-cdk-lib/aws-route53-targets';

export class AediFargateService
  extends AediBaseConstruct<RefType.FARGATE_SERVICE>
  implements
    IComputeDependency<FargateServiceConstructRef>,
    ICloudfrontBehaviorSource,
    IConnectable
{
  public readonly fargateServiceRef: AnyFargateServiceRef;
  public readonly fargateService: ApplicationLoadBalancedFargateService;
  public readonly port: number;
  public readonly privateDomainName: string;
  public readonly publicDomainName?: string;
  public readonly connections: Connections;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: AnyFargateServiceRef },
  ) {
    super(scope, id, props);

    const fargateServiceRef = (this.fargateServiceRef = this.resourceRef);

    const { dependencies, environment } = createComputeDependencyEnv(
      fargateServiceRef,
      fargateServiceRef.context,
    );

    if (!fargateServiceRef.handlerLocation) {
      throw new Error(
        `Unable to resolve fargate service handler location: ${fargateServiceRef.uid}`,
      );
    }

    const port = (this.port = fargateServiceRef.port);
    const aediCluster = resolveConstruct(fargateServiceRef.cluster);
    const { cluster } = aediCluster;
    const vpc = cluster.vpc;

    let image: ContainerImage;
    let imageEnv: Record<string, string> = {};

    /**
     * If the fargate image is a function, treat it as the entrypoint for a Nodejs container.
     * The function's file will be bundled with Esbuild and executed as the entrypoint of the container.
     */
    if (typeof fargateServiceRef.image === 'function') {
      // Generate the Dockerfile and use esbuild to bundle the handler
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

      image = ContainerImage.fromDockerImageAsset(
        new DockerImageAsset(this, 'container-image', {
          directory: tempBuildDir,
        }),
      );
    } else if ('registry' in fargateServiceRef.image) {
      image = ContainerImage.fromRegistry(fargateServiceRef.image.registry);
      Object.assign(imageEnv, fargateServiceRef.image.environment);
    } else {
      console.error('Unknown image object:', fargateServiceRef.image);
      throw new Error('Unimplemented');
    }

    const taskDefinition = new FargateTaskDefinition(this, 'task-definition', {
      cpu: fargateServiceRef.cpu,
      memoryLimitMiB: fargateServiceRef.memoryLimitMiB,
    });

    let healthcheckCommand: string;
    if (fargateServiceRef.healthcheck?.command) {
      healthcheckCommand = fargateServiceRef.healthcheck.command;
    } else if (fargateServiceRef.healthcheck?.path) {
      healthcheckCommand = `curl -f http://localhost:${port}${fargateServiceRef.healthcheck.path} || exit 1`;
    } else {
      healthcheckCommand = `echo "No healthcheck"`;
    }

    const containerDefinition = new ContainerDefinition(
      this,
      'container-definition',
      {
        taskDefinition: taskDefinition,
        image,
        portMappings: [
          {
            containerPort: port,
          },
        ],
        environment: {
          ...environment,
          ...imageEnv,
          PORT: port.toString(),
          HOST: '0.0.0.0',
        },
        healthCheck: {
          command: ['CMD-SHELL', healthcheckCommand],
        },
      },
    );

    taskDefinition.defaultContainer = containerDefinition;

    const securityGroup = new SecurityGroup(this, 'security-group', {
      vpc,
      allowAllOutbound: true,
    });

    this.connections = new Connections({
      securityGroups: [securityGroup],
      defaultPort: Port.tcp(port),
    });

    const serviceProps: NotReadOnly<ApplicationLoadBalancedFargateServiceProps> =
      {
        cluster,
        desiredCount: 1,
        securityGroups: [securityGroup],
        taskDefinition,
        listenerPort: port,
        circuitBreaker: {
          rollback: true,
        },
      };

    /**
     * Only pass the domain name and certificate if the service is load balanced.
     * Otherwise, the domain name and certificate will be handled using a cloudfront distribution
     * that sits in front of the service.
     */
    let hostedZone: IHostedZone | undefined;
    if (fargateServiceRef.domain) {
      serviceProps.domainName = fargateServiceRef.domain.name;
      hostedZone = serviceProps.domainZone = PublicHostedZone.fromLookup(
        this,
        'hosted-zone',
        { domainName: fargateServiceRef.domain.zone },
      );
      serviceProps.certificate = new Certificate(this, 'certificate', {
        domainName: fargateServiceRef.domain.name,
        validation: CertificateValidation.fromDns(serviceProps.domainZone),
      });
    }

    const fargateService = new ApplicationLoadBalancedFargateService(
      this,
      'alb-fargate-service',
      serviceProps,
    );
    this.fargateService = fargateService;
    this.privateDomainName =
      this.fargateService.loadBalancer.loadBalancerDnsName;

    // Add ALB healthcheck path if specified
    if (fargateServiceRef.healthcheck?.path) {
      fargateService.targetGroup.configureHealthCheck({
        path: fargateServiceRef.healthcheck?.path,
      });
    }

    // Grant the service access to each of its dependencies.
    for (const { construct, clientRef } of dependencies) {
      const options = 'options' in clientRef ? clientRef.options : undefined;
      if ('grantComputeAccess' in construct) {
        construct.grantComputeAccess?.(
          fargateService.taskDefinition.taskRole,
          options,
        );
      }
      if ('grantComputeNetworkAccess' in construct) {
        construct.grantComputeNetworkAccess?.(this, options);
      }
    }

    if (fargateServiceRef.domain) {
      new ARecord(this, 'a-record', {
        recordName: fargateServiceRef.domain.name,
        target: RecordTarget.fromAlias(
          new LoadBalancerTarget(fargateService.loadBalancer),
        ),
        zone: hostedZone!,
      });
    }
  }

  addCloudfrontBehavior(
    distribution: Distribution,
    options: StaticSiteBehaviorOptions,
  ): void {
    distribution.addBehavior(
      options.path,
      this.fargateService instanceof ApplicationLoadBalancedFargateService
        ? new LoadBalancerV2Origin(this.fargateService.loadBalancer, {
            protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
            httpPort: this.port,
          })
        : new HttpOrigin(this.privateDomainName, { httpPort: this.port }),
      {
        cachePolicy: fromEnumKey(
          CachePolicy,
          options.cachePolicy,
          'CACHING_DISABLED',
        ),
        allowedMethods: fromEnumKey(
          AllowedMethods,
          options.allowedMethods,
          'ALLOW_ALL',
        ),
        originRequestPolicy: fromEnumKey(
          OriginRequestPolicy,
          options.originRequestPolicy,
          'ALL_VIEWER',
        ),
      },
    );
  }

  grantComputeNetworkAccess(connectable: IConnectable): void {
    this.connections.allowDefaultPortFrom(connectable);
  }

  getConstructRef() {
    return {
      region: Stack.of(this).region,
      url: this.publicDomainName
        ? `https://${this.publicDomainName}`
        : `http://${this.privateDomainName}:${this.port}`,
    };
  }
}

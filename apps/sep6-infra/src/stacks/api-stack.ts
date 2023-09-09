/* eslint-disable @typescript-eslint/no-unused-vars */
import { Duration, Environment, Stack, StackProps } from 'aws-cdk-lib';
import {
  CorsOptions,
  LambdaIntegration,
  ResponseType,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import {
  DomainPair,
  ResourceType,
  collectMergedModuleResources,
  collectModuleRoutes,
  getResourceMetadata,
  searchUpModuleTree,
} from '@sep6/utils';
import { AppModule } from '@sep6/app';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { existsSync, unlinkSync } from 'fs';
import { appendFile } from 'fs/promises';
import { WebApp, WebAppDns } from '../constructs/web-app';
import { resolve } from 'path';
import { DomainId } from '@sep6/constants';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  ARecord,
  HostedZone,
  IHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export interface ApiStackProps {
  env: Environment;
  domains?: {
    [K in DomainId]?: DomainPair;
  };
}

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { domains, ...props }: StackProps & ApiStackProps
  ) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const hostedZones = new Map<string, IHostedZone>();
    const domainMap = new Map(Object.entries(domains ?? {}));

    // Cloudfront requires certs in us-east-1, so this stack is just used to hold those certs
    let cachedUsEastCertStack: Stack | null = null;

    // Lazily create the us-east-1 stack in case it isn't needed
    const getUsEastCertStack = () => {
      if (!cachedUsEastCertStack) {
        cachedUsEastCertStack = new Stack(scope, `${id}-east1-cert-stack`, {
          ...props,
          env: {
            ...props.env,
            region: 'us-east-1',
          },
          crossRegionReferences: true,
        });
      }
      return cachedUsEastCertStack;
    };

    // Cached lookup of hosted zones based on their domain
    const getHostedZone = (scope: Construct, domainZone: string) => {
      let hostedZone = hostedZones.get(domainZone);
      if (!hostedZone) {
        hostedZone = HostedZone.fromLookup(
          scope,
          `hosted-zone-${domainZone.replace(/\./g, '-')}`,
          { domainName: domainZone }
        );
        hostedZones.set(domainZone, hostedZone);
      }
      return hostedZone;
    };

    // Get a cert for a specific domain in a scope (could be the app region or us-east-1)
    const getCert = (scope: Construct, id: string, domainPair: DomainPair) => {
      return new Certificate(scope, id, {
        domainName: domainPair.domainName,
        validation: CertificateValidation.fromDns(
          getHostedZone(scope, domainPair.domainZone)
        ),
      });
    };

    let logQueue = Promise.resolve();
    if (existsSync('./debug.md')) {
      unlinkSync('./debug.md');
    }
    const debug = (...args: any[]) => {
      logQueue = logQueue.then(() =>
        appendFile(
          './debug.md',
          args.map((arg) => String(arg)).join(' ') + '\n'
        )
      );
    };

    const lambdaResources = collectMergedModuleResources(
      AppModule,
      ResourceType.LAMBDA_FUNCTION
    );
    const dynamoResources = collectMergedModuleResources(
      AppModule,
      ResourceType.DYNAMO_TABLE
    );
    const webAppResources = collectMergedModuleResources(
      AppModule,
      ResourceType.WEB_APP
    );

    // Resolve web-app DNS before lambdas are created (used to handle CORS)
    const webAppResourcesWithDns = webAppResources.map((webAppResource) => {
      const metadata = webAppResource.mergedMetadata;
      let dns: WebAppDns | undefined = undefined;

      const domainPair = metadata.domainName
        ? domainMap.get(metadata.domainName)
        : null;

      debug(` -- WEB APP ${resolve(metadata.distPath)}`);

      if (domainPair) {
        const certificate = getCert(
          getUsEastCertStack(),
          `${metadata.id}-cert`,
          domainPair
        );
        const hostedZone = getHostedZone(this, domainPair.domainZone);
        dns = {
          domainPair,
          certificate,
          hostedZone,
        };
        debug(`    -- DOMAIN ${domainPair.domainName}`);
      }

      return { ...webAppResource, dns };
    });

    // Create dynamo tables for all the dynamo modules found in the app tree
    const dynamoTables = dynamoResources.map((dynamoResource) => {
      const metadata = dynamoResource.mergedMetadata;

      debug(` -- TABLE ${dynamoResource.mergedMetadata.id}`);

      return Object.assign(
        new Table(this, metadata.id, {
          tableName: metadata.id,
          partitionKey: {
            name: metadata.partitionKey.name,
            type: AttributeType[metadata.partitionKey.type],
          },
          ...(metadata.sortKey
            ? {
                sortKey: {
                  name: metadata.sortKey.name,
                  type: AttributeType[metadata.sortKey.type],
                },
              }
            : {}),
        }),
        { nestResource: dynamoResource }
      );
    });

    const NO_DOMAIN = Symbol('NO_DOMAIN');
    const restApis = new Map<string | typeof NO_DOMAIN, RestApi>([]);
    const defaultCorsPreflightOptions: CorsOptions = {
      allowCredentials: true,
      // Allow all origins
      allowOrigins: webAppResourcesWithDns
        .map((webApp) => webApp.dns?.domainPair.domainName)
        .filter(Boolean)
        .map((domainName) => `https://${domainName}`),
    };
    const getRestApi = (domainId: DomainId | null | undefined) => {
      const domainPair = domainId ? domainMap.get(domainId) : null;
      if (!domainId || !domainPair) {
        let restApi = restApis.get(NO_DOMAIN);
        if (!restApi) {
          restApi = new RestApi(this, 'rest-api', {
            defaultCorsPreflightOptions,
          });
          restApi.addGatewayResponse('unauthorized-response', {
            type: ResponseType.UNAUTHORIZED,
            statusCode: '401',
            responseHeaders: {
              'Access-Control-Allow-Origin': "'*'",
            },
            templates: {
              'application/json':
                '{ "message": $context.error.messageString, "statusCode": "401", "type": "$context.error.responseType" }',
            },
          });
          restApis.set(NO_DOMAIN, restApi);
        }
        return restApi;
      }

      const { domainName, domainZone } = domainPair;
      let restApi = restApis.get(domainName);
      if (!restApi) {
        const restApiId = `rest-api-${domainId
          .toLowerCase()
          .replace(/_/g, '-')}`;
        restApi = new RestApi(this, restApiId, {
          domainName: {
            domainName,
            certificate: getCert(this, `${restApiId}-cert`, domainPair),
          },
          defaultCorsPreflightOptions,
        });
        restApi.addGatewayResponse('unauthorized-response', {
          type: ResponseType.UNAUTHORIZED,
          statusCode: '401',
          responseHeaders: {
            'Access-Control-Allow-Origin': "'*'",
          },
          templates: {
            'application/json':
              '{ "message": $context.error.messageString, "statusCode": "401", "type": "$context.error.responseType" }',
          },
        });
        new ARecord(this, `${restApiId}-a-record`, {
          recordName: domainName,
          target: RecordTarget.fromAlias(new targets.ApiGateway(restApi)),
          zone: getHostedZone(this, domainZone),
        });

        restApis.set(domainName, restApi);
      }

      return restApi;
    };

    // Create lambdas for all the lambda modules found in the app tree
    const lambdas = lambdaResources.flatMap((lambdaResourceGroup) => {
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

      // Modules without any controllers
      if (lambdaResource.controllers.length === 0) {
        return [];
      }

      // Ignore lambda modules that are registered inside other lambda modules
      // These should typically be caught in the controller count check above.
      const parentLambda = searchUpModuleTree(
        lambdaResource.parent,
        (node) =>
          !!getResourceMetadata(node.module, ResourceType.LAMBDA_FUNCTION)
      );
      if (parentLambda) {
        console.warn(
          `Nested lambda module ${lambdaResource.name} in ${parentLambda.name} has controllers registered.`
        );
        return [];
      }
      debug(
        `-- LAMBDA ${lambdaResource.name} -> ${
          lambdaResource.resourceMetadata.handlerFilePath
        } (${lambdaResource.resourceMetadata.domainName ?? 'NO DOMAIN'})`
      );

      const fn = new NodejsFunction(this, lambdaResource.name, {
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
      });

      const restApi = getRestApi(lambdaResource.resourceMetadata.domainName);
      debug(
        `    -- Rest API: ${restApi.domainName?.domainName ?? 'GENERATED'}`
      );
      // Gather dynamo table and grant access
      const childDynamoDbTableResources = collectMergedModuleResources(
        lambdaResource.module,
        ResourceType.DYNAMO_TABLE
      );

      for (const {
        resourceId,
        resourceNodes,
        mergedMetadata,
      } of childDynamoDbTableResources) {
        const allMetadata = resourceNodes.map((node) => node.resourceMetadata);
        debug(`   -- Table - ${resourceId}`, allMetadata);
        const dynamoDbTable = dynamoTables.find(
          (table) => table.nestResource.mergedMetadata.id === resourceId
        );
        if (!dynamoDbTable) {
          throw new Error(
            `Unable to resolve dynamodb table dependency of ${lambdaResource.name}: table ${mergedMetadata.id} could not be found.`
          );
        }
        if (
          mergedMetadata.permissions?.read &&
          mergedMetadata.permissions.write
        ) {
          dynamoDbTable.grantReadWriteData(fn);
          debug(
            `       -- GRANT: READ/WRITE on ${mergedMetadata.id} TO ${lambdaResource.name}`
          );
        } else if (mergedMetadata.permissions?.read) {
          debug(
            `       -- GRANT: READ on ${mergedMetadata.id} TO ${lambdaResource.name}`
          );
          dynamoDbTable.grantReadData(fn);
        } else if (mergedMetadata.permissions?.write) {
          debug(
            `       -- GRANT: WRITE on ${mergedMetadata.id} TO ${lambdaResource.name}`
          );
          dynamoDbTable.grantWriteData(fn);
        }
      }

      // Add API gateway routes for the lambda
      const routes = collectModuleRoutes(lambdaResource.module);
      for (const route of routes) {
        debug(
          `   -- ROUTE ${lambdaResource.name}.${route.controller.name}.${String(
            route.name
          )} ${route.method} ${route.path}`
        );

        const routeParts = route.path
          .split('/')
          .filter((part) => part.length > 0)
          .map((part) => (part[0] === ':' ? `{${part.slice(1)}}` : part));

        const routeResource = routeParts.reduce(
          (resource, routePart) =>
            resource.getResource(routePart) ?? resource.addResource(routePart),
          restApi.root
        );
        routeResource.addMethod(route.method, new LambdaIntegration(fn));
      }

      const clientConfig = {
        [lambdaResource.name]: {
          baseURL: restApi.domainName?.domainName
            ? `https://${restApi.domainName.domainName}/`
            : restApi.url,
        },
      };

      return [{ ...lambdaResource, fn, clientConfig }];
    });

    // Create cloudfront distributions for all the web-apps
    const webApps = webAppResourcesWithDns.map((webAppResource) => {
      const metadata = webAppResource.mergedMetadata;

      return new WebApp(this, metadata.id, {
        distPath: metadata.distPath,
        clientConfig: {
          api: lambdas.reduce(
            (apiConfig, lambda) => ({ ...apiConfig, ...lambda.clientConfig }),
            {}
          ),
        },
        dns: webAppResource.dns,
      });
    });
  }
}

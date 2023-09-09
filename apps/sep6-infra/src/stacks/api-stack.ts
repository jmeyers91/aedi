/* eslint-disable @typescript-eslint/no-unused-vars */
import { App, Duration, Environment, Stack, StackProps } from 'aws-cdk-lib';
import {
  CorsOptions,
  LambdaIntegration,
  ResponseType,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import {
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
import { WebApp } from '../constructs/web-app';
import { resolve } from 'path';
import { DomainId } from '@sep6/constants';
import { debug } from '../utils/debug';
import { RestApiCache } from '../constructs/rest-api-cache';
import { DnsManager, DomainMap } from '../constructs/dns-manager';
import { DynamoTableResourceConstruct } from '../constructs/dynamo-table-resource';
import { NestRestApi } from '../constructs/nest-rest-api';
import { NestLambdaResource } from '../constructs/nest-lambda-resource';

export interface ApiStackProps {
  envName: string;
  env: Environment;
  defaultApiDomain?: DomainId;
  domains?: DomainMap;
}

export class ApiStack extends Stack {
  constructor(
    scope: App,
    id: string,
    {
      envName,
      domains = {},
      defaultApiDomain,
      ...props
    }: StackProps & ApiStackProps
  ) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const dnsManager = new DnsManager(this, 'dns-manager', {
      app: scope,
      domains,
    });

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

      debug(` -- WEB APP ${resolve(metadata.distPath)}`);

      return {
        ...webAppResource,
        dns: dnsManager.getDomainCert(metadata.domain, { region: 'us-east-1' }),
      };
    });

    // Create dynamo tables for all the dynamo modules found in the app tree
    const dynamoTables = dynamoResources.map((dynamoResource) => {
      debug(` -- TABLE ${dynamoResource.mergedMetadata.id}`);

      return new DynamoTableResourceConstruct(
        this,
        dynamoResource.mergedMetadata.id,
        {
          envName,
          dynamoResource,
        }
      );
    });

    const restApiCache = new RestApiCache(
      this,
      'rest-apis',
      (cacheScope, domain) =>
        new NestRestApi(
          cacheScope,
          `rest-api-${domain?.toLowerCase() ?? 'default'}`,
          {
            envName,
            domain,
            dnsManager,
            defaultCorsOrigins: webAppResourcesWithDns
              .map((webApp) => webApp.dns?.domainPair.domainName)
              .filter(Boolean)
              .map((domainName) => `https://${domainName}`),
          }
        )
    );

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
        } (${lambdaResource.resourceMetadata.domain ?? 'NO DOMAIN'})`
      );

      // Allow lambda modules to specify the specific domains they want to allow CORS requests from.
      // TODO: Add support for specifying external domains as well
      const { allowCorsDomains } = lambdaResourceGroup.mergedMetadata;
      const allowedCorsWebApps = Array.isArray(allowCorsDomains)
        ? webAppResourcesWithDns.filter(
            (webApp) =>
              webApp.dns && allowCorsDomains.includes(webApp.dns.domain)
          )
        : webAppResourcesWithDns; // Allow cross-origin requests from all web-apps by default

      // Only set CORS domains if every allowed web app has a real domain - we can't know the generated Cloudfront domain here
      const corsEnabled = allowedCorsWebApps.every(
        (webApp) => webApp.dns?.domainPair
      );
      const corsOrigins = corsEnabled
        ? allowedCorsWebApps.map(
            (webApp) => `https://${webApp.dns?.domainPair.domainName}`
          )
        : null;

      debug(`  -- CORS origins: ${corsOrigins?.join(', ') ?? '*'}`);

      const fn = new NestLambdaResource(this, lambdaResource.name, {
        lambdaResource,
        envName,
        corsOrigins,
      });

      new NodejsFunction(this, lambdaResource.name, {
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
          ENV_NAME: envName,
          ...(corsOrigins
            ? {
                CORS_ORIGINS: JSON.stringify(corsOrigins),
              }
            : {}),
        },
      });

      const restApi = restApiCache.findOrCreateRestApi(
        lambdaResource.resourceMetadata.domain
      );
      debug(`    -- Rest API: ${restApi.node.id}`);
      // Gather dynamo table and grant access
      const childDynamoDbTableResources = collectMergedModuleResources(
        lambdaResource.module,
        ResourceType.DYNAMO_TABLE
      );

      for (const {
        resourceId,
        mergedMetadata,
      } of childDynamoDbTableResources) {
        debug(`   -- Table - ${resourceId}`);
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

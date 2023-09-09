/* eslint-disable @typescript-eslint/no-unused-vars */
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import {
  ResourceType,
  collectMergedModuleResources,
  collectModuleResources,
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
import { WebApp } from '../constructs/web-app';
import { resolve } from 'path';

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
    const restApi = new RestApi(this, 'rest-api');

    const lambdaResources = collectModuleResources(
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

    const lambdas = lambdaResources.flatMap((lambdaResource) => {
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
        `-- LAMBDA ${lambdaResource.name} -> ${lambdaResource.resourceMetadata.handlerFilePath}`
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

      // Gather resource dependencies and grant access
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

      return [{ ...lambdaResource, fn }];
    });

    const webApps = webAppResources.map((webAppResource) => {
      const metadata = webAppResource.mergedMetadata;

      debug(` -- WEB APP ${resolve(metadata.distPath)}`);
      return new WebApp(this, metadata.id, {
        distPath: metadata.distPath,
        clientConfig: { apiUrl: restApi.url },
      });
    });
  }
}

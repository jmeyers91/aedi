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

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const restApi = new RestApi(this, 'rest-api');

    const lambdaResources = collectModuleResources(
      AppModule,
      ResourceType.LAMBDA_FUNCTION
    );
    const dynamoResources = collectMergedModuleResources(
      AppModule,
      ResourceType.DYNAMO_TABLE
    );

    //
    const dynamoTables = dynamoResources.map((dynamoResource) => {
      const metadata = dynamoResource.mergedMetadata;

      console.log(`-- Dynamo table ${dynamoResource.mergedMetadata.id}`);

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
        console.log(
          `Ignoring empty lambda (no controllers registered)`,
          lambdaResource.name
        );
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
      console.log(
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
        console.log(`   -- Table - ${resourceId}`, allMetadata);
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
          console.log(
            `       -- GRANT: READ/WRITE on ${mergedMetadata.id} TO ${lambdaResource.name}`
          );
        } else if (mergedMetadata.permissions?.read) {
          console.log(
            `       -- GRANT: READ on ${mergedMetadata.id} TO ${lambdaResource.name}`
          );
          dynamoDbTable.grantReadData(fn);
        } else if (mergedMetadata.permissions?.write) {
          console.log(
            `       -- GRANT: WRITE on ${mergedMetadata.id} TO ${lambdaResource.name}`
          );
          dynamoDbTable.grantWriteData(fn);
        }
      }

      // Add API gateway routes for the lambda
      const routes = collectModuleRoutes(lambdaResource.module);
      for (const route of routes) {
        console.log(
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
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Duration, Environment, Stack, StackProps } from 'aws-cdk-lib';
import c from 'ansi-colors';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
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
import { WebApp, WebAppDns } from '../constructs/web-app';
import { resolve } from 'path';
import { DomainId, UserPoolId } from '@sep6/constants';
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
import { debug } from '../utils/debug';
import { AppUserPool } from '../constructs/app-user-pool';
import { UserPoolClient } from 'aws-cdk-lib/aws-cognito';

export interface ApiStackProps {
  env: Environment;
  defaultApiDomain?: DomainId;
  domains?: {
    [K in DomainId]?: DomainPair;
  };
  userPoolDomainPrefixes: {
    [K in UserPoolId]: string;
  };
}

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    {
      domains,
      defaultApiDomain,
      userPoolDomainPrefixes,
      ...props
    }: StackProps & ApiStackProps
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

    const lambdaResources = collectMergedModuleResources(
      AppModule,
      ResourceType.LAMBDA_FUNCTION
    );
    const dynamoResources = collectMergedModuleResources(
      AppModule,
      ResourceType.DYNAMO_TABLE
    );
    const userPoolResources = collectMergedModuleResources(
      AppModule,
      ResourceType.USER_POOL
    );
    const webAppResources = collectMergedModuleResources(
      AppModule,
      ResourceType.WEB_APP
    );

    // Resolve web-app DNS before lambdas are created (used to handle CORS)
    const webAppResourcesWithDns = webAppResources.map((webAppResource) => {
      const metadata = webAppResource.mergedMetadata;
      let dns: WebAppDns | undefined = undefined;

      const domainPair = metadata.domain
        ? domainMap.get(metadata.domain)
        : null;

      debug(` -- ${c.blue('WEB APP')} ${resolve(metadata.distPath)}`);

      if (domainPair) {
        const certificate = getCert(
          getUsEastCertStack(),
          `${metadata.id}-cert`,
          domainPair
        );
        const hostedZone = getHostedZone(this, domainPair.domainZone);
        dns = {
          domainId: metadata.domain as DomainId,
          domainPair,
          certificate,
          hostedZone,
        };
        debug(`    -- ${c.yellow('DOMAIN')} ${domainPair.domainName}`);
      }

      return { ...webAppResource, dns };
    });

    // Create dynamo tables for all the dynamo modules found in the app tree
    const dynamoTables = dynamoResources.map((dynamoResource) => {
      const metadata = dynamoResource.mergedMetadata;

      debug(` -- ${c.red('TABLE')} ${dynamoResource.mergedMetadata.id}`);

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

    const userPools = userPoolResources.map((userPoolResource) => {
      debug(
        ` -- ${c.green('USER POOL')} ${userPoolResource.mergedMetadata.id}`
      );
      return new AppUserPool(
        this,
        `user-pool-${userPoolResource.mergedMetadata.id}`,
        {
          userPoolResource,
          domainPrefix:
            userPoolDomainPrefixes[userPoolResource.mergedMetadata.id],
        }
      );
    });
    const getUserPool = (userPoolId: UserPoolId): AppUserPool => {
      const pool = userPools.find(
        (pool) => userPoolId === pool.userPoolResource.mergedMetadata.id
      );
      if (!pool) {
        throw new Error(`Unable to find pool ${userPoolId}`);
      }
      return pool;
    };

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
    const getRestApi = (metadataDomainId: DomainId | null | undefined) => {
      const domainId = metadataDomainId ?? defaultApiDomain;
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
          defaultCorsPreflightOptions,
          domainName: {
            domainName,
            certificate: getCert(this, `${restApiId}-cert`, domainPair),
          },
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
        debug(`[A-Record] ${domainName} -> ${restApi.node.id}`);

        restApis.set(domainName, restApi);
      }

      return restApi;
    };

    const cognitoAuthorizers = new Map<string, CognitoUserPoolsAuthorizer>();
    const getCognitoAuthorizer = (userPool: AppUserPool) => {
      const authorizerId = `${userPool.userPoolResource.mergedMetadata.id}-authorizer`;
      let authorizer = cognitoAuthorizers.get(authorizerId);
      if (!authorizer) {
        authorizer = new CognitoUserPoolsAuthorizer(this, authorizerId, {
          cognitoUserPools: [userPool],
        });
        cognitoAuthorizers.set(authorizerId, authorizer);
      }
      return authorizer;
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
        `-- ${c.cyan('LAMBDA')} ${lambdaResource.name} -> ${
          lambdaResource.resourceMetadata.handlerFilePath
        } (${lambdaResource.resourceMetadata.domain ?? 'NO DOMAIN'})`
      );

      // Allow lambda modules to specify the specific domains they want to allow CORS requests from.
      // TODO: Add support for specifying external domains as well
      const { allowCorsDomains } = lambdaResourceGroup.mergedMetadata;
      const allowedCorsWebApps = Array.isArray(allowCorsDomains)
        ? webAppResourcesWithDns.filter(
            (webApp) =>
              webApp.dns && allowCorsDomains.includes(webApp.dns.domainId)
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
        environment: corsOrigins
          ? {
              NEST_LAMBDA_RESOURCE: JSON.stringify(
                {
                  controllers: lambdaResource.controllers,
                  resourceMetadata: lambdaResource.resourceMetadata,
                },
                null,
                2
              ),
              CORS_ORIGINS: JSON.stringify(corsOrigins),
            }
          : {},
      });

      const restApi = getRestApi(lambdaResource.resourceMetadata.domain);
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
        debug(`     -- Api gateway path: ${route.apiGatewayPath}`);

        if (route.cognitoAuthorizer) {
          debug(`     -- AUTHORIZER: ${route.cognitoAuthorizer.userPool}`);
        }
        const routeUserPool = route.cognitoAuthorizer
          ? getUserPool(route.cognitoAuthorizer.userPool)
          : null;
        const routeCognitoAuthorizer = routeUserPool
          ? getCognitoAuthorizer(routeUserPool)
          : null;

        const routeParts = route.apiGatewayPath
          .split('/')
          .filter((part) => part.length > 0);

        const routeResource = routeParts.reduce(
          (resource, routePart) =>
            resource.getResource(routePart) ?? resource.addResource(routePart),
          restApi.root
        );
        routeResource.addMethod(route.method, new LambdaIntegration(fn), {
          operationName: route.name as string,
          ...(routeCognitoAuthorizer
            ? {
                authorizer: routeCognitoAuthorizer,
                authorizationType: AuthorizationType.COGNITO,
              }
            : {}),
        });
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

      let userPoolPair: {
        userPool: AppUserPool;
        userPoolClient: UserPoolClient;
      } | null;

      if (metadata.userPool) {
        const userPool = userPools.find(
          (pool) =>
            pool.userPoolResource.mergedMetadata.id === metadata.userPool
        );
        if (!userPool) {
          throw new Error(
            `Unable to resolve user pool ${metadata.userPool} for web app ${webAppResource.mergedMetadata.id}`
          );
        }

        userPoolPair = {
          userPool,
          userPoolClient: userPool.addClient(
            `${webAppResource.mergedMetadata.id}-user-pool-client`
          ),
        };
      } else {
        userPoolPair = null;
      }

      return new WebApp(this, metadata.id, {
        distPath: metadata.distPath,
        clientConfig: {
          auth: userPoolPair
            ? {
                userPoolId: userPoolPair.userPool.userPoolId,
                userPoolWebClientId:
                  userPoolPair.userPoolClient.userPoolClientId,
                region: Stack.of(userPoolPair.userPool).region,
              }
            : undefined,

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

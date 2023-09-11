/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Duration, Environment, Stack, StackProps } from 'aws-cdk-lib';
import c from 'ansi-colors';
import { ClientConfig } from '@sep6/client-config';
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
  ArnResolver,
  DomainPair,
  LambdaType,
  ResourceMetadata,
  ResourceType,
  collectMergedModuleResources,
  collectModuleRoutes,
  getResourceMetadata,
  searchUpModuleTree,
} from '@sep6/utils';
import { AppModule } from '@sep6/app';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnEventSourceMapping, Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  AttributeType,
  StreamViewType,
  TableV2,
} from 'aws-cdk-lib/aws-dynamodb';
import { WebAppConstruct, WebAppDns } from '../constructs/web-app-construct';
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
import {
  UserPoolConstruct,
  IdentityPoolInfo,
} from '../constructs/user-pool-construct';
import { UserPoolClient, UserPoolTriggers } from 'aws-cdk-lib/aws-cognito';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

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
    ).map((lambdaResourceGroup) => {
      const lambdaName = lambdaResourceGroup.mergedMetadata.lambdaName;
      let nodeJsFunction: NodejsFunction;
      return {
        ...lambdaResourceGroup,
        getNodeJsFunction: (): NodejsFunction => {
          if (!nodeJsFunction) {
            nodeJsFunction = new NodejsFunction(this, lambdaName, {
              runtime: Runtime.NODEJS_18_X,
              entry: lambdaResourceGroup.mergedMetadata.handlerFilePath,
              handler: `index.${lambdaName}.lambdaHandler`,
              timeout: Duration.seconds(15),
              bundling: {
                externalModules: [
                  '@nestjs/microservices',
                  '@nestjs/websockets/socket-module',
                ],
              },
            });

            // Gather dependency dynamo tables and grant access
            const lambdaResource = lambdaResourceGroup.resourceNodes[0];
            const childDynamoDbTableResources = collectMergedModuleResources(
              lambdaResource.module,
              ResourceType.DYNAMO_TABLE
            );

            for (const {
              resourceId,
              mergedMetadata: tableMetadata,
            } of childDynamoDbTableResources) {
              debug(`   -- Table - ${resourceId}`);
              const dynamoDbTable = dynamoTables.find(
                (table) => table.nestResource.mergedMetadata.id === resourceId
              );
              if (!dynamoDbTable) {
                throw new Error(
                  `Unable to resolve dynamodb table dependency of ${lambdaResource.name}: table ${tableMetadata.id} could not be found.`
                );
              }
              if (
                tableMetadata.permissions?.read &&
                tableMetadata.permissions.write
              ) {
                dynamoDbTable.grantReadWriteData(nodeJsFunction);
                debug(
                  `       -- GRANT: READ/WRITE on ${tableMetadata.id} TO ${lambdaResource.name}`
                );
              } else if (tableMetadata.permissions?.read) {
                debug(
                  `       -- GRANT: READ on ${tableMetadata.id} TO ${lambdaResource.name}`
                );
                dynamoDbTable.grantReadData(nodeJsFunction);
              } else if (tableMetadata.permissions?.write) {
                debug(
                  `       -- GRANT: WRITE on ${tableMetadata.id} TO ${lambdaResource.name}`
                );
                dynamoDbTable.grantWriteData(nodeJsFunction);
              }
            }

            // Gather dependency S3 buckets and grant access
            const childBucketResources = collectMergedModuleResources(
              lambdaResource.module,
              ResourceType.S3_BUCKET
            );

            for (const {
              resourceId,
              mergedMetadata: bucketMetadata,
            } of childBucketResources) {
              debug(`   -- Bucket - ${resourceId}`);
              const bucket = buckets.find(
                (bucket) =>
                  bucket.bucketResource.mergedMetadata.id === bucketMetadata.id
              );
              if (!bucket) {
                throw new Error(
                  `Unable to resolve S3 bucket dependency of ${lambdaResource.name}: bucket ${bucketMetadata.id} could not be found.`
                );
              }
              const permissions = bucketMetadata.permissions ?? {};
              if (permissions.read) {
                debug(`       -- GRANT: READ`);
                bucket.grantRead(nodeJsFunction);
              }
              if (permissions.write) {
                debug(`       -- GRANT: WRITE`);
                bucket.grantWrite(nodeJsFunction);
              }
              if (permissions.put) {
                debug(`       -- GRANT: PUT`);
                bucket.grantPut(nodeJsFunction);
              }
              if (permissions.delete) {
                debug(`       -- GRANT: DELETE`);
                bucket.grantDelete(nodeJsFunction);
              }
            }
          }

          return nodeJsFunction;
        },
      };
    });

    // Collect metadata about resources from the nest app module tree
    const bucketResources = collectMergedModuleResources(
      AppModule,
      ResourceType.S3_BUCKET
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

    // Create S3 buckets for all the bucket modules found in the app tree
    const buckets = bucketResources.map((bucketResource) => {
      const metadata = bucketResource.mergedMetadata;

      const bucket = Object.assign(new Bucket(this, metadata.id), {
        bucketResource,
      });

      // TODO: Check if the bucket has any deployment resources

      return Object.assign(bucket, {
        nestResource: bucketResource,
        nestConstructArn: bucket.bucketArn,
        addWebAppPermissions: ({
          webAppClientConfig,
        }: {
          webAppClientConfig: ClientConfig;
        }) => {
          webAppClientConfig.buckets[bucketResource.mergedMetadata.id] = {
            region: Stack.of(bucket).region,
            bucketName: bucket.bucketName,
          };
          bucket.addCorsRule({
            allowedOrigins: ['*'], // TODO: Only allow access to the web apps that depend on this bucket
            allowedHeaders: ['*'],
            allowedMethods: [
              HttpMethods.GET,
              HttpMethods.HEAD,
              HttpMethods.PUT,
              HttpMethods.POST,
              HttpMethods.DELETE,
            ],
            exposedHeaders: [
              'x-amz-server-side-encryption',
              'x-amz-request-id',
              'x-amz-id-2',
              'ETag',
            ],
            maxAge: 3000,
          });
        },
      });
    });

    // Create dynamo tables for all the dynamo modules found in the app tree
    const dynamoTables = dynamoResources.map((dynamoResource) => {
      const metadata = dynamoResource.mergedMetadata;

      debug(` -- ${c.red('TABLE')} ${dynamoResource.mergedMetadata.id}`);

      let streamViewType = metadata.streamViewType;
      if (!streamViewType && metadata.streams?.length) {
        streamViewType = StreamViewType.NEW_AND_OLD_IMAGES;
      }

      const table = new TableV2(new Construct(this, metadata.id), metadata.id, {
        tableName: metadata.id,
        partitionKey: {
          name: metadata.partitionKey.name,
          type: AttributeType[metadata.partitionKey.type],
        },
        dynamoStream: streamViewType,
        ...(metadata.sortKey
          ? {
              sortKey: {
                name: metadata.sortKey.name,
                type: AttributeType[metadata.sortKey.type],
              },
            }
          : {}),
      });

      return Object.assign(table, {
        nestResource: dynamoResource,
        nestConstructArn: table.tableArn,
        addWebAppPermissions: ({
          webAppClientConfig,
        }: {
          webAppClientConfig: ClientConfig;
        }) => {
          // Add table info to the web app client config
          webAppClientConfig.tables[dynamoResource.mergedMetadata.id] = {
            tableName: table.tableName,
            region: Stack.of(table).region,
          };
        },
      });
    });

    // Create user pools for all the user pool modules found in the app tree
    const userPools = userPoolResources.map((userPoolResource) => {
      debug(
        ` -- ${c.green('USER POOL')} ${userPoolResource.mergedMetadata.id}`
      );
      const { lambdaTriggers = {} } = userPoolResource.mergedMetadata;
      const userPoolTriggers: {
        -readonly [K in keyof UserPoolTriggers]: UserPoolTriggers[K];
      } = {};

      // Resolve cognito trigger lambdas
      for (const [triggerKey, triggerFnModule] of Object.entries(
        lambdaTriggers
      )) {
        const triggerLambdaMetadata =
          triggerFnModule.resourceMetadata as ResourceMetadata<ResourceType.LAMBDA_FUNCTION>;
        if (
          !triggerLambdaMetadata ||
          triggerLambdaMetadata.type !== ResourceType.LAMBDA_FUNCTION
        ) {
          throw new Error(
            `Cognito trigger ${triggerKey} in ${userPoolResource.mergedMetadata.id} is not a lambda resource`
          );
        }
        if (triggerLambdaMetadata.lambdaType !== LambdaType.STANDARD) {
          throw new Error(
            `Cognito trigger ${triggerKey} in ${userPoolResource.mergedMetadata.id} is not a standard lambda resource. API resources can't be used as trigger handlers.`
          );
        }
        const triggerLambdaResource = lambdaResources.find(
          (lambdaResource) =>
            lambdaResource.mergedMetadata.id === triggerLambdaMetadata.id
        );
        if (!triggerLambdaResource) {
          throw new Error(
            `Unable to find ${triggerKey}: ${triggerFnModule.name} - did you forget to import it?`
          );
        }
        userPoolTriggers[triggerKey] =
          triggerLambdaResource.getNodeJsFunction();

        debug(
          `   -- ${triggerKey}: ${triggerFnModule.name} -> ${triggerLambdaResource.resourceId}`
        );
      }

      const userPoolConstruct = new UserPoolConstruct(
        this,
        `user-pool-${userPoolResource.mergedMetadata.id}`,
        {
          userPoolResource,
          domainPrefix:
            userPoolDomainPrefixes[userPoolResource.mergedMetadata.id],
          lambdaTriggers: userPoolTriggers,
        }
      );

      return Object.assign(userPoolConstruct, {
        nestResource: userPoolResource,
        nestConstructArn: userPoolConstruct.userPoolArn,
      });
    });
    const getUserPool = (userPoolId: UserPoolId): UserPoolConstruct => {
      const pool = userPools.find(
        (pool) => userPoolId === pool.userPoolResource.mergedMetadata.id
      );
      if (!pool) {
        throw new Error(`Unable to find pool ${userPoolId}`);
      }
      return pool;
    };

    const defaultCorsPreflightOptions: CorsOptions = {
      allowCredentials: true,
      // Allow all origins
      allowOrigins: webAppResourcesWithDns
        .map((webApp) => webApp.dns?.domainPair.domainName)
        .filter(Boolean)
        .map((domainName) => `https://${domainName}`),
    };

    // Mapping from domains to rest APIs
    const NO_DOMAIN = Symbol('NO_DOMAIN');
    const restApis = new Map<string | typeof NO_DOMAIN, RestApi>([]);
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

    // Mapping from user pools to cognito authorizers
    const cognitoAuthorizers = new Map<string, CognitoUserPoolsAuthorizer>();
    const getCognitoAuthorizer = (userPool: UserPoolConstruct) => {
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

    // Connect dynamo tables to lambdas with event streams
    const eventSourceMappings = new Construct(this, 'event-source-mappings');
    for (const dynamoTable of dynamoTables) {
      const dynamoResource = dynamoTable.nestResource;
      for (const streamConfig of dynamoResource.mergedMetadata.streams ?? []) {
        const triggerLambdaMetadata = streamConfig.lambda
          .resourceMetadata as ResourceMetadata<ResourceType.LAMBDA_FUNCTION>;
        const triggerLambdaResource = lambdaResources.find(
          (lambdaResource) =>
            lambdaResource.mergedMetadata.id === triggerLambdaMetadata.id
        );
        debug(
          `   -- STREAM ${streamConfig.lambda.name} -> ${triggerLambdaResource?.mergedMetadata.handlerFilePath}`
        );
        if (!triggerLambdaResource) {
          throw new Error(
            `Could not resolve dynamo table ${dynamoResource.mergedMetadata.id} stream lambda ${streamConfig.lambda.name}`
          );
        }
        const streamFn = triggerLambdaResource.getNodeJsFunction();
        new CfnEventSourceMapping(
          eventSourceMappings,
          `${dynamoTable.nestResource.mergedMetadata.id}-${triggerLambdaResource.mergedMetadata.lambdaName}`,
          {
            functionName: streamFn.functionName,
            eventSourceArn: dynamoTable.tableStreamArn,
            batchSize: streamConfig.batchSize,
            filterCriteria: streamConfig.filterCriteria ?? {
              filters: streamConfig.filterPatterns?.map((pattern) => ({
                pattern: JSON.stringify(pattern),
              })),
            },
            startingPosition: streamConfig.startingPosition,
          }
        );
        dynamoTable.grantStreamRead(streamFn);
      }
    }

    // Create lambdas for all the lambda modules found in the app tree
    const apiLambdas = lambdaResources.flatMap((lambdaResourceGroup) => {
      // Only process API lambdas here
      if (lambdaResourceGroup.mergedMetadata.lambdaType !== LambdaType.API) {
        return [];
      }

      const lambdaResourcesWithControllers =
        lambdaResourceGroup.resourceNodes.filter(
          (node) => node.controllers.length > 0
        );

      if (lambdaResourcesWithControllers.length > 1) {
        throw new Error(
          `Ambiguous lambda module: ${lambdaResourceGroup.mergedMetadata.handlerFilePath} - a lambda module can only be registered with controllers once in the Nest module tree.`
        );
      }

      if (lambdaResourcesWithControllers.length === 0) {
        throw new Error(
          `Unable to find any controllers for the API lambda ${lambdaResourceGroup.mergedMetadata.handlerFilePath}`
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
        `-- ${c.cyan('LAMBDA')} ${
          lambdaResource.resourceMetadata.lambdaName
        } -> ${lambdaResource.resourceMetadata.handlerFilePath} (domain = ${
          lambdaResource.resourceMetadata.domain ?? 'NO DOMAIN'
        })`
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
      const fn = lambdaResourceGroup.getNodeJsFunction();
      if (corsOrigins) {
        fn.addEnvironment('CORS_ORIGINS', JSON.stringify(corsOrigins));
      }
      fn.addEnvironment(
        'NEST_LAMBDA_RESOURCE',
        JSON.stringify(
          {
            controllers: lambdaResource.controllers,
            resourceMetadata: lambdaResource.resourceMetadata,
          },
          null,
          2
        )
      );

      // Get the API gateway rest api for the domain and register the lambda's routes
      const restApi = getRestApi(lambdaResource.resourceMetadata.domain);
      debug(`    -- Rest API: ${restApi.node.id}`);

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

    // Resolve resource constructs by type and id
    const getResourceConstruct = <T extends ResourceType>(
      resourceType: T,
      resourceId: string
    ):
      | (typeof dynamoTables)[number]
      | (typeof buckets)[number]
      | (typeof userPools)[number]
      | undefined => {
      const constructsWithType: any =
        {
          [ResourceType.DYNAMO_TABLE]: dynamoTables,
          [ResourceType.S3_BUCKET]: buckets,
          [ResourceType.USER_POOL]: userPools,
          [ResourceType.LAMBDA_FUNCTION]: undefined,
          [ResourceType.WEB_APP]: undefined,
        }[resourceType] ?? [];
      const constructsWithId = constructsWithType.filter(
        (construct: any) => construct.nestResource.resourceId === resourceId
      );

      if (constructsWithId.length > 1) {
        throw new Error(
          `Found multiple constructs for Nest resource type ${resourceType} with id ${resourceId}`
        );
      }
      return constructsWithId[0] as any;
    };

    // Create cloudfront distributions for all the web-apps
    const webApps = webAppResourcesWithDns.map((webAppResource) => {
      const metadata = webAppResource.mergedMetadata;
      const webAppId = metadata.id;

      const webAppClientConfig: ClientConfig = {
        api: apiLambdas.reduce(
          (apiConfig, lambda) => ({ ...apiConfig, ...lambda.clientConfig }),
          {} as ClientConfig['api']
        ),
        buckets: {},
        tables: {},
      };

      let userPoolConfig: {
        userPool: UserPoolConstruct;
        userPoolClient: UserPoolClient;
        identityPool: IdentityPoolInfo;
      } | null;

      // Add user pool client, config, and permission bindings to the web app
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

        const userPoolClient = userPool.addClient(
          `${webAppResource.mergedMetadata.id}-user-pool-client`
        );
        const identityPool = userPool.addClientIdentityPool(
          `${webAppResource.mergedMetadata.id}-identity-pool`,
          userPoolClient
        );

        // Enable cognito identity permissions
        const userPoolPermissions =
          userPool.userPoolResource.mergedMetadata.permissions ?? [];

        // Generate policy statements for the web app's cognito identity
        const policyStatements = userPoolPermissions.map(
          (permission) =>
            new PolicyStatement({
              effect: permission.effect === 'DENY' ? Effect.DENY : Effect.ALLOW,
              actions: permission.actions,
              conditions: permission.condition,
              resources: permission.resources?.map((dependentResource) => {
                let dependentResourceModule: ArnResolver['resourceModule'];
                let arnFn: ArnResolver['arnFn'] | undefined;

                if ('arnFn' in dependentResource) {
                  dependentResourceModule = dependentResource.resourceModule;
                  arnFn = dependentResource.arnFn;
                } else {
                  dependentResourceModule = dependentResource;
                }

                const dependentResourceMetadata = getResourceMetadata(
                  dependentResourceModule
                );
                if (!dependentResourceMetadata) {
                  throw new Error(
                    `Unable to resolve metadata for cognito permission resource: ${dependentResourceModule.name} in web app ${webAppId}`
                  );
                }
                const dependentResourceConstruct = getResourceConstruct(
                  dependentResourceMetadata.type,
                  dependentResourceMetadata.id
                );

                if (!dependentResourceConstruct) {
                  throw new Error(
                    `Unable to resolve construct for cognito permission resource: ${dependentResourceModule.name} in web app ${webAppId}`
                  );
                }

                // Add resource-specific permissions and config
                if ('addWebAppPermissions' in dependentResourceConstruct) {
                  dependentResourceConstruct.addWebAppPermissions({
                    webAppClientConfig,
                  });
                }

                debug(
                  ` -- COGNITO PERMISSION: ${
                    permission.effect ?? 'ALLOW'
                  } ${permission.actions.join('/')} on ${
                    dependentResourceMetadata.type
                  } ${
                    dependentResourceMetadata.id
                  } for users signed into ${webAppId}`
                );

                return arnFn
                  ? arnFn(dependentResourceConstruct.nestConstructArn)
                  : dependentResourceConstruct.nestConstructArn;
              }),
            })
        );

        for (const policyStatement of policyStatements) {
          identityPool.authedRole.addToPolicy(policyStatement);
        }

        userPoolConfig = {
          userPool,
          userPoolClient,
          identityPool,
        };

        webAppClientConfig.auth = {
          userPoolId: userPoolConfig.userPool.userPoolId,
          userPoolWebClientId: userPoolConfig.userPoolClient.userPoolClientId,
          identityPoolId: userPoolConfig.identityPool.identityPoolId,
          region: Stack.of(userPoolConfig.userPool).region,
        };
      } else {
        userPoolConfig = null;
      }

      return new WebAppConstruct(this, metadata.id, {
        distPath: metadata.distPath,
        clientConfig: webAppClientConfig,
        dns: webAppResource.dns,
      });
    });
  }
}

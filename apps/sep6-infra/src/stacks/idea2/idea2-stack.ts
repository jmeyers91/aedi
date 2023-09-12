/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { idea } from './idea2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  LambdaRef,
  ConstructRefMap,
  IdeaAppHandlerEnv,
  DynamoRef,
  RefType,
  BucketRef,
} from './idea2-types';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

export class Idea2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const nodeJsFunctionCache = new Map<string, NodejsFunction>();
    const dynamoTableCache = new Map<string, TableV2>();
    const bucketCache = new Map<string, Bucket>();

    const createBucketConstruct = (bucketRef: BucketRef) => {
      const bucket = new Bucket(this, bucketRef.id, {});

      if (bucketRef.assetPath) {
        let distribution: Distribution | undefined = undefined;

        if (bucketRef.domain) {
          const originAccessIdentity = new OriginAccessIdentity(
            this,
            'access-identity'
          );

          bucket.grantRead(originAccessIdentity);

          // TODO: Add DNS support
          distribution = new Distribution(this, 'distribution', {
            defaultBehavior: {
              origin: new S3Origin(bucket, { originAccessIdentity }),
              viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            defaultRootObject: 'index.html',
            errorResponses: [
              {
                httpStatus: 404,
                responseHttpStatus: 200,
                responsePagePath: '/index.html',
              },
            ],
          });
        }

        new BucketDeployment(this, 'deployment', {
          sources: [Source.asset(bucketRef.assetPath)],
          destinationBucket: bucket,
          distribution,
        });
      }

      return bucket;
    };

    const createTableConstruct = (dynamoRef: DynamoRef<any, any>) => {
      return new TableV2(this, dynamoRef.id, {
        tableName: `idea2-${dynamoRef.id}`,
        partitionKey: {
          name: dynamoRef.partitionKey.name,
          type: AttributeType[dynamoRef.partitionKey.type],
        },
        sortKey: dynamoRef.sortKey
          ? {
              name: dynamoRef.sortKey.name as string,
              type: AttributeType[dynamoRef.sortKey.type],
            }
          : undefined,
      });
    };

    const createFnConstruct = (lambdaRef: LambdaRef<any, any>) => {
      const contextConstructRefs: ConstructRefMap = {
        functions: {},
        tables: {},
        buckets: {},
      };
      const dependencyConstructs: {
        functions: NodejsFunction[];
        tables: TableV2[];
        buckets: Bucket[];
      } = {
        functions: [],
        tables: [],
        buckets: [],
      };

      for (const [_contextKey, contextValue] of Object.entries(
        lambdaRef.context
      )) {
        const dependencyRefType = (contextValue as any)?.type as
          | RefType
          | undefined;

        if (dependencyRefType === RefType.LAMBDA) {
          const depLambdaRefId = (contextValue as LambdaRef<any, any>)
            ?.id as string;
          const depLambdaRef = idea.lambdas.get(depLambdaRefId);
          if (!depLambdaRef) {
            throw new Error(
              `Unable to resolve lambda ref ${depLambdaRefId} from lambda ${lambdaRef.id}`
            );
          }
          const depLambdaConstruct = getOrCreateFnConstruct(depLambdaRef);

          contextConstructRefs.functions[depLambdaRef.id] = {
            functionName: depLambdaConstruct.functionName,
            region: Stack.of(depLambdaConstruct).region,
          };

          dependencyConstructs.functions.push(depLambdaConstruct);
        }

        if (dependencyRefType === RefType.DYNAMO) {
          const dynamoRefId = (contextValue as DynamoRef<any, any>)
            ?.id as string;
          const depDynamoRef = idea.tables.get(dynamoRefId);
          if (!depDynamoRef) {
            throw new Error(
              `Unable to resolve dynamo ref ${dynamoRefId} from lambda ${lambdaRef.id}`
            );
          }
          const depDynamoConstruct = getOrCreateDynamoConstruct(depDynamoRef);

          contextConstructRefs.tables[depDynamoRef.id] = {
            tableName: depDynamoConstruct.tableName,
            region: Stack.of(depDynamoConstruct).region,
          };

          dependencyConstructs.tables.push(depDynamoConstruct);
        }

        if (dependencyRefType === RefType.BUCKET) {
          const bucketRefId = (contextValue as BucketRef)?.id as string;
          const depBucketRef = idea.buckets.get(bucketRefId);
          if (!depBucketRef) {
            throw new Error(
              `Unable to resolve bucket ref ${bucketRefId} from lambda ${lambdaRef.id}`
            );
          }
          const depBucketConstruct = getOrCreateBucketConstruct(depBucketRef);

          contextConstructRefs.buckets[depBucketRef.id] = {
            bucketName: depBucketConstruct.bucketName,
            region: Stack.of(depBucketConstruct).region,
          };

          dependencyConstructs.buckets.push(depBucketConstruct);
        }
      }

      const environment: IdeaAppHandlerEnv = {
        IDEA_FUNCTION_ID: lambdaRef.id,
        IDEA_CONSTRUCT_REF_MAP: contextConstructRefs,
      };

      const nodeJsFunction = new NodejsFunction(this, lambdaRef.id, {
        functionName: `idea2-${lambdaRef.id}`,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(15),
        handler: `index.${lambdaRef.id}.lambdaHandler`,
        entry: lambdaRef.filepath,
        environment: {
          ...environment,
          IDEA_CONSTRUCT_REF_MAP: JSON.stringify(
            environment.IDEA_CONSTRUCT_REF_MAP
          ),
        },
      });

      console.log(`- Lambda ${lambdaRef.id} -> ${lambdaRef.filepath}`);

      // Grant the function permission to call its dependency lambda function
      for (const dependencyNodejsFn of dependencyConstructs.functions) {
        dependencyNodejsFn.grantInvoke(nodeJsFunction);
      }

      // Grant the function permission to access its dependency dynamo tables
      for (const dependencyDynamoTable of dependencyConstructs.tables) {
        dependencyDynamoTable.grantReadWriteData(nodeJsFunction);
      }

      // Grant the function permission to access its dependency S3 buckets
      for (const dependencyS3Bucket of dependencyConstructs.buckets) {
        dependencyS3Bucket.grantReadWrite(nodeJsFunction);
      }

      return nodeJsFunction;
    };

    const getOrCreateFnConstruct = (
      lambdaRef: LambdaRef<any, any>
    ): NodejsFunction => {
      const cached = nodeJsFunctionCache.get(lambdaRef.id);
      if (cached) {
        return cached;
      }
      const fn = createFnConstruct(lambdaRef);
      nodeJsFunctionCache.set(lambdaRef.id, fn);
      return fn;
    };

    const getOrCreateDynamoConstruct = (
      dynamoRef: DynamoRef<any, any>
    ): TableV2 => {
      const cached = dynamoTableCache.get(dynamoRef.id);
      if (cached) {
        return cached;
      }
      const table = createTableConstruct(dynamoRef);
      dynamoTableCache.set(dynamoRef.id, table);
      return table;
    };

    const getOrCreateBucketConstruct = (bucketRef: BucketRef): Bucket => {
      const cached = bucketCache.get(bucketRef.id);
      if (cached) {
        return cached;
      }
      const bucket = createBucketConstruct(bucketRef);
      bucketCache.set(bucketRef.id, bucket);
      return bucket;
    };

    for (const lambdaRef of idea.lambdas.values()) {
      getOrCreateFnConstruct(lambdaRef);
    }

    for (const dynamoRef of idea.tables.values()) {
      getOrCreateDynamoConstruct(dynamoRef);
    }

    for (const bucketRef of idea.buckets.values()) {
      getOrCreateBucketConstruct(bucketRef);
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import {
  ClientRef,
  ConstructRefMap,
  DynamoClientRef,
  DynamoRefClientOptions,
  Idea2AppHandlerEnv,
  LambdaRef,
  RefType,
  ResourceRef,
} from './idea2-types';
import { createConstructName, getIdea2StackContext } from './idea2-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Idea2Bucket } from './idea2-bucket-construct';
import { Idea2DynamoTable } from './idea2-dynamo-construct';
import { getClientRefFromRef } from './idea2-client-utils';

export class Idea2LambdaFunction extends Construct {
  static cachedFactory(
    scope: Construct,
    lambdaRef: LambdaRef<any, any, any>
  ): Idea2LambdaFunction {
    const cache = getIdea2StackContext(scope).getCache<Idea2LambdaFunction>(
      RefType.LAMBDA
    );
    const cached = cache.get(lambdaRef.id);
    if (cached) {
      return cached;
    }
    const lambda = new Idea2LambdaFunction(
      Stack.of(scope),
      `lambda-${lambdaRef.id}`,
      {
        lambdaRef,
      }
    );
    cache.set(lambdaRef.id, lambda);
    return lambda;
  }

  public readonly lambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    { lambdaRef }: { lambdaRef: LambdaRef<any, any, any> }
  ) {
    super(scope, id);

    const contextConstructRefs: ConstructRefMap = {
      functions: {},
      tables: {},
      buckets: {},
    };
    const dependencyConstructs: {
      functions: Idea2LambdaFunction[];
      tables: {
        construct: Idea2DynamoTable;
        clientOptions: DynamoRefClientOptions;
      }[];
      buckets: Idea2Bucket[];
    } = {
      functions: [],
      tables: [],
      buckets: [],
    };

    for (const contextValue of Object.values(lambdaRef.context)) {
      const dependencyClientRef = getClientRefFromRef(
        contextValue as ClientRef | ResourceRef
      );

      if ('lambda' in dependencyClientRef) {
        const depLambdaRef = dependencyClientRef.lambda;
        const depLambdaConstruct = Idea2LambdaFunction.cachedFactory(
          this,
          depLambdaRef
        );

        contextConstructRefs.functions[depLambdaRef.id] = {
          functionName: depLambdaConstruct.lambdaFunction.functionName,
          region: Stack.of(depLambdaConstruct).region,
        };

        dependencyConstructs.functions.push(depLambdaConstruct);
      }

      if ('dynamo' in dependencyClientRef) {
        const { dynamo: depDynamoRef, options: depDynamoClientOptions = {} } =
          dependencyClientRef as DynamoClientRef<any, DynamoRefClientOptions>;

        const depDynamoConstruct = Idea2DynamoTable.cachedFactory(
          this,
          depDynamoRef
        );

        contextConstructRefs.tables[depDynamoRef.id] = {
          tableName: depDynamoConstruct.table.tableName,
          region: Stack.of(depDynamoConstruct).region,
        };

        dependencyConstructs.tables.push({
          construct: depDynamoConstruct,
          clientOptions: depDynamoClientOptions,
        });
      }

      if ('bucket' in dependencyClientRef) {
        const depBucketRef = dependencyClientRef.bucket;
        const depBucketConstruct = Idea2Bucket.cachedFactory(
          this,
          depBucketRef
        );

        contextConstructRefs.buckets[depBucketRef.id] = {
          bucketName: depBucketConstruct.bucket.bucketName,
          region: Stack.of(depBucketConstruct).region,
        };

        dependencyConstructs.buckets.push(depBucketConstruct);
      }
    }

    const environment: Idea2AppHandlerEnv = {
      IDEA_FUNCTION_ID: lambdaRef.id,
      IDEA_CONSTRUCT_REF_MAP: contextConstructRefs,
    };

    const nodeJsFunction = new NodejsFunction(this, lambdaRef.id, {
      functionName: createConstructName(this, lambdaRef.id),
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
    this.lambdaFunction = nodeJsFunction;

    console.log(`- Lambda ${lambdaRef.id} -> ${lambdaRef.filepath}`);

    // Grant the function permission to call its dependency lambda function
    for (const dependencyNodejsFn of dependencyConstructs.functions) {
      dependencyNodejsFn.lambdaFunction.grantInvoke(nodeJsFunction);
    }

    // Grant the function permission to access its dependency dynamo tables
    for (const { construct, clientOptions } of dependencyConstructs.tables) {
      if (clientOptions.readonly) {
        construct.table.grantReadData(nodeJsFunction);
      } else {
        construct.table.grantReadWriteData(nodeJsFunction);
      }
    }

    // Grant the function permission to access its dependency S3 buckets
    for (const dependencyS3Bucket of dependencyConstructs.buckets) {
      dependencyS3Bucket.bucket.grantReadWrite(nodeJsFunction);
    }
  }
}

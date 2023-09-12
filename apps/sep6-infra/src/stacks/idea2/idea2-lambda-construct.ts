/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import {
  BucketRef,
  ConstructRefMap,
  DynamoRef,
  IdeaAppHandlerEnv,
  LambdaRef,
  RefType,
} from './idea2-types';
import { createConstructName, getIdea2StackContext } from './idea2-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { idea } from './idea2';
import { Idea2Bucket } from './idea2-bucket-construct';
import { Idea2DynamoTable } from './idea2-dynamo-construct';

export class Idea2LambdaFunction extends Construct {
  static cachedFactory(
    scope: Construct,
    lambdaRef: LambdaRef<any, any>
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
    { lambdaRef }: { lambdaRef: LambdaRef<any, any> }
  ) {
    super(scope, id);

    const contextConstructRefs: ConstructRefMap = {
      functions: {},
      tables: {},
      buckets: {},
    };
    const dependencyConstructs: {
      functions: Idea2LambdaFunction[];
      tables: Idea2DynamoTable[];
      buckets: Idea2Bucket[];
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

      if (dependencyRefType === RefType.DYNAMO) {
        const dynamoRefId = (contextValue as DynamoRef<any, any>)?.id as string;
        const depDynamoRef = idea.tables.get(dynamoRefId);
        if (!depDynamoRef) {
          throw new Error(
            `Unable to resolve dynamo ref ${dynamoRefId} from lambda ${lambdaRef.id}`
          );
        }
        const depDynamoConstruct = Idea2DynamoTable.cachedFactory(
          this,
          depDynamoRef
        );

        contextConstructRefs.tables[depDynamoRef.id] = {
          tableName: depDynamoConstruct.table.tableName,
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

    const environment: IdeaAppHandlerEnv = {
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
    for (const dependencyDynamoTable of dependencyConstructs.tables) {
      dependencyDynamoTable.table.grantReadWriteData(nodeJsFunction);
    }

    // Grant the function permission to access its dependency S3 buckets
    for (const dependencyS3Bucket of dependencyConstructs.buckets) {
      dependencyS3Bucket.bucket.grantReadWrite(nodeJsFunction);
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import { createConstructName, getIdea2StackContext } from './idea2-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Idea2Bucket } from './idea2-bucket-construct';
import { Idea2DynamoTable } from './idea2-dynamo-construct';
import {
  ClientRef,
  ConstructRefMap,
  Idea2AppHandlerEnv,
  LambdaRef,
  RefType,
  ResourceRef,
  getClientRefFromRef,
} from '@sep6/idea2';
import { Idea2UserPool } from './idea2-user-pool-construct';
import { ILambdaDependency } from './idea2-infra-types';

export class Idea2LambdaFunction
  extends Construct
  implements ILambdaDependency
{
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
  public readonly lambdaRef: LambdaRef<any, any, any>;

  constructor(
    scope: Construct,
    id: string,
    { lambdaRef }: { lambdaRef: LambdaRef<any, any, any> }
  ) {
    super(scope, id);

    this.lambdaRef = lambdaRef;

    const contextConstructRefs: ConstructRefMap = {
      functions: {},
      tables: {},
      buckets: {},
      userPools: {},
    };
    const dependencies: {
      clientRef: ClientRef;
      construct: ILambdaDependency;
    }[] = [];

    for (const contextValue of Object.values(lambdaRef.context)) {
      const clientRef = getClientRefFromRef(
        contextValue as ClientRef | ResourceRef
      );
      let dependencyConstruct: ILambdaDependency | undefined = undefined;

      if ('lambda' in clientRef) {
        dependencyConstruct = Idea2LambdaFunction.cachedFactory(
          this,
          clientRef.lambda
        );
      }

      if ('dynamo' in clientRef) {
        dependencyConstruct = Idea2DynamoTable.cachedFactory(
          this,
          clientRef.dynamo
        );
      }

      if ('bucket' in clientRef) {
        dependencyConstruct = Idea2Bucket.cachedFactory(this, clientRef.bucket);
      }

      if ('userPool' in clientRef) {
        dependencyConstruct = Idea2UserPool.cachedFactory(
          this,
          clientRef.userPool
        );
      }

      if (dependencyConstruct) {
        dependencyConstruct.provideConstructRef(contextConstructRefs);
        dependencies.push({ construct: dependencyConstruct, clientRef });
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

    for (const { construct, clientRef } of dependencies) {
      construct.grantLambdaAccess(
        this,
        'options' in clientRef ? clientRef.options : undefined
      );
    }
  }

  provideConstructRef(contextRefMap: ConstructRefMap): void {
    contextRefMap.functions[this.lambdaRef.id] = {
      functionName: this.lambdaFunction.functionName,
      region: Stack.of(this).region,
    };
  }

  grantLambdaAccess(lambda: Idea2LambdaFunction): void {
    this.lambdaFunction.grantInvoke(lambda.lambdaFunction);
  }
}

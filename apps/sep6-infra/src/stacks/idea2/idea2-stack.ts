/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { idea } from './idea2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaRef, ConstructRefMap, IdeaAppHandlerEnv } from './idea2-types';

export class Idea2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const nodeJsFunctionCache = new Map<string, NodejsFunction>();

    const createFnConstruct = (lambdaRef: LambdaRef<any, any>) => {
      const contextConstructRefs: ConstructRefMap = {
        functions: {},
      };
      const dependencyConstructs: NodejsFunction[] = [];

      for (const [_contextKey, contextValue] of Object.entries(
        lambdaRef.context
      )) {
        const depLambdaRef = idea.lambdas.get(
          (contextValue as LambdaRef<any, any>)?.id
        );
        if (!depLambdaRef) {
          continue;
        }
        const depLambdaConstruct = getOrCreateFnConstruct(depLambdaRef);

        contextConstructRefs.functions[depLambdaRef.id] = {
          functionName: depLambdaConstruct.functionName,
        };

        dependencyConstructs.push(depLambdaConstruct);
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

      for (const dependencyNodejsFn of dependencyConstructs) {
        dependencyNodejsFn.grantInvoke(nodeJsFunction);
      }

      return nodeJsFunction;
    };

    function getOrCreateFnConstruct(
      lambdaRef: LambdaRef<any, any>
    ): NodejsFunction {
      const cached = nodeJsFunctionCache.get(lambdaRef.id);
      if (cached) {
        return cached;
      }
      const fn = createFnConstruct(lambdaRef);
      nodeJsFunctionCache.set(lambdaRef.id, fn);
      return fn;
    }

    for (const lambdaRef of idea.lambdas.values()) {
      getOrCreateFnConstruct(lambdaRef);
    }
  }
}

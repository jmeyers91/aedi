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
} from './idea2-types';
import { AttributeType, Table, TableV2 } from 'aws-cdk-lib/aws-dynamodb';

export class Idea2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const nodeJsFunctionCache = new Map<string, NodejsFunction>();
    const dynamoTableCache = new Map<string, TableV2>();

    const createTableConstruct = (dynamoRef: DynamoRef) => {
      return new TableV2(this, dynamoRef.id, {
        tableName: `idea2-${dynamoRef.id}`,
        partitionKey: {
          name: dynamoRef.partitionKey.name,
          type: AttributeType[dynamoRef.partitionKey.type],
        },
        sortKey: dynamoRef.sortKey
          ? {
              name: dynamoRef.sortKey.name,
              type: AttributeType[dynamoRef.sortKey.type],
            }
          : undefined,
      });
    };

    const createFnConstruct = (lambdaRef: LambdaRef<any, any>) => {
      const contextConstructRefs: ConstructRefMap = {
        functions: {},
        tables: {},
      };
      const dependencyConstructs: {
        functions: NodejsFunction[];
        tables: TableV2[];
      } = {
        functions: [],
        tables: [],
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
          };

          dependencyConstructs.functions.push(depLambdaConstruct);
        }

        if (dependencyRefType === RefType.DYNAMO) {
          const dynamoRefId = (contextValue as DynamoRef)?.id as string;
          const depDynamoRef = idea.tables.get(dynamoRefId);
          if (!depDynamoRef) {
            throw new Error(
              `Unable to resolve dynamo ref ${dynamoRefId} from lambda ${lambdaRef.id}`
            );
          }
          const depDynamoConstruct = getOrCreateDynamoConstruct(depDynamoRef);

          contextConstructRefs.tables[depDynamoRef.id] = {
            tableName: depDynamoConstruct.tableName,
          };

          dependencyConstructs.tables.push(depDynamoConstruct);
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

    const getOrCreateDynamoConstruct = (dynamoRef: DynamoRef): TableV2 => {
      const cached = dynamoTableCache.get(dynamoRef.id);
      if (cached) {
        return cached;
      }
      const table = createTableConstruct(dynamoRef);
      dynamoTableCache.set(dynamoRef.id, table);
      return table;
    };

    for (const lambdaRef of idea.lambdas.values()) {
      getOrCreateFnConstruct(lambdaRef);
    }
  }
}

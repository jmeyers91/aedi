/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import { resolveConstruct, createConstructName } from '../idea2-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ClientRef,
  ConstructRefMap,
  Idea2AppHandlerEnv,
  LambdaConstructRef,
  LambdaRef,
  ResourceRef,
  getClientRefFromRef,
} from '@sep6/idea2';
import { ILambdaDependency } from '../idea2-infra-types';

export class Idea2LambdaFunction
  extends Construct
  implements ILambdaDependency<LambdaConstructRef>
{
  public readonly lambdaFunction;
  public readonly lambdaRef: LambdaRef<any, any, any>;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: lambdaRef }: { resourceRef: LambdaRef<any, any, any> }
  ) {
    super(scope, id);

    this.lambdaRef = lambdaRef;

    const contextConstructRefs: Partial<ConstructRefMap> = {};
    const dependencies: {
      clientRef: ClientRef;
      construct: ILambdaDependency<any> | Construct;
    }[] = [];

    for (const contextValue of Object.values(lambdaRef.context)) {
      const clientRef = getClientRefFromRef(
        contextValue as ClientRef | ResourceRef
      );
      const ref = clientRef.ref;
      const construct = resolveConstruct(this, ref);

      if (construct) {
        if ('getConstructRef' in construct) {
          contextConstructRefs[ref.type] = Object.assign(
            contextConstructRefs[ref.type] ?? {},
            {
              [ref.id]: (construct as any).getConstructRef(),
            }
          );
        }

        dependencies.push({ construct, clientRef });
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
      if ('grantLambdaAccess' in construct) {
        construct.grantLambdaAccess(
          this,
          'options' in clientRef ? clientRef.options : undefined
        );
      }
    }
  }

  getConstructRef() {
    return {
      functionName: this.lambdaFunction.functionName,
      region: Stack.of(this).region,
    };
  }

  grantLambdaAccess(lambda: Idea2LambdaFunction): void {
    this.lambdaFunction.grantInvoke(lambda.lambdaFunction);
  }
}

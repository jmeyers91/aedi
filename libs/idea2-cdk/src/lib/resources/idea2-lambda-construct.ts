import { Construct } from 'constructs';
import { resolveConstruct, isLambdaDependency } from '../idea2-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ClientRef,
  Idea2AppHandlerEnv,
  LambdaConstructRef,
  LambdaRef,
  ConstructRefLookupMap,
  getClientRefFromRef,
  LambdaDependencyGroup,
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

    const constructUidMap: ConstructRefLookupMap = {};
    const dependencies: {
      clientRef: ClientRef;
      construct: ILambdaDependency<any> | Construct;
    }[] = [];

    // Collect dependencies from the lambda context refs
    for (const contextValue of Object.values(
      lambdaRef.context as LambdaDependencyGroup
    )) {
      const clientRef = getClientRefFromRef(contextValue);
      const ref = clientRef.ref;
      const construct = resolveConstruct(ref);

      if (construct) {
        if ('getConstructRef' in construct) {
          constructUidMap[ref.uid] = (construct as any).getConstructRef();
        }

        dependencies.push({ construct, clientRef });
      }
    }

    const environment: Idea2AppHandlerEnv = {
      IDEA_FUNCTION_ID: lambdaRef.id,
      IDEA_FUNCTION_UID: lambdaRef.uid,
      IDEA_CONSTRUCT_UID_MAP: constructUidMap,
    };

    if (!lambdaRef.handlerLocation) {
      throw new Error(
        `Unable to resolve lambda handler location: ${lambdaRef.uid}`
      );
    }

    const baseNodejsFunctionProps: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(15),
      handler: lambdaRef.handlerLocation.exportKey,
      entry: lambdaRef.handlerLocation.filepath,
      environment: {
        ...environment,
        IDEA_CONSTRUCT_UID_MAP: JSON.stringify(
          environment.IDEA_CONSTRUCT_UID_MAP
        ),
      },
    };

    // Allow each dependency resrouce the opportunity to extend the nodejs options
    const transformedNodejsFunctionProps = dependencies
      .map((it) => it.construct)
      .filter(isLambdaDependency)
      .reduce(
        (props, construct) => construct.transformLambdaProps?.(props) ?? props,
        baseNodejsFunctionProps
      );

    // Create the nodejs function
    const nodeJsFunction = new NodejsFunction(
      this,
      'function',
      transformedNodejsFunctionProps
    );
    this.lambdaFunction = nodeJsFunction;

    console.log(
      `- Lambda ${lambdaRef.id} -> ${lambdaRef.filepath} ${lambdaRef.handlerLocation.filepath} ${lambdaRef.handlerLocation.exportKey}`
    );

    // Grant the lambda access to each of its dependencies.
    for (const { construct, clientRef } of dependencies) {
      if ('grantLambdaAccess' in construct) {
        construct.grantLambdaAccess?.(
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

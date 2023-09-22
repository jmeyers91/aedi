import { Construct } from 'constructs';
import { resolveConstruct, isLambdaDependency } from '../aedi-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ClientRef,
  AediAppHandlerEnv,
  LambdaConstructRef,
  LambdaRef,
  ConstructRefLookupMap,
  getClientRefFromRef,
  LambdaDependencyGroup,
  RefType,
} from '@aedi/common';
import { ILambdaDependency } from '../aedi-infra-types';
import { AediBaseConstruct } from '../aedi-base-construct';

export class AediLambdaFunction
  extends AediBaseConstruct<RefType.LAMBDA>
  implements ILambdaDependency<LambdaConstructRef>
{
  public readonly lambdaFunction;
  public readonly lambdaRef: LambdaRef<any, any, any>;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: LambdaRef<any, any, any> },
  ) {
    super(scope, id, props);

    const lambdaRef = (this.lambdaRef = this.resourceRef);

    const constructUidMap: ConstructRefLookupMap = {};
    const dependencies: {
      clientRef: ClientRef;
      construct: ILambdaDependency<any> | Construct;
    }[] = [];

    // Collect dependencies from the lambda context refs
    for (const contextValue of Object.values(
      lambdaRef.context as LambdaDependencyGroup,
    )) {
      // Ignore event transforms here - they're only relevant at runtime and require no additional permissions or construct refs
      if ('transformEvent' in contextValue) {
        continue;
      }
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

    const environment: AediAppHandlerEnv = {
      AEDI_FUNCTION_ID: lambdaRef.id,
      AEDI_FUNCTION_UID: lambdaRef.uid,
      AEDI_CONSTRUCT_UID_MAP: constructUidMap,
    };

    if (!lambdaRef.handlerLocation) {
      throw new Error(
        `Unable to resolve lambda handler location: ${lambdaRef.uid}`,
      );
    }

    const baseNodejsFunctionProps: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(15),
      handler: lambdaRef.handlerLocation.exportKey,
      entry: lambdaRef.handlerLocation.filepath,
      environment: {
        ...environment,
        AEDI_CONSTRUCT_UID_MAP: JSON.stringify(
          environment.AEDI_CONSTRUCT_UID_MAP,
        ),
      },
    };

    // Allow each dependency resrouce the opportunity to extend the nodejs options
    const transformedNodejsFunctionProps = dependencies
      .map((it) => it.construct)
      .filter(isLambdaDependency)
      .reduce(
        (props, construct) => construct.transformLambdaProps?.(props) ?? props,
        baseNodejsFunctionProps,
      );

    // Create the nodejs function
    const nodeJsFunction = new NodejsFunction(
      this,
      'function',
      transformedNodejsFunctionProps,
    );
    this.lambdaFunction = nodeJsFunction;

    console.log(
      `- Lambda ${lambdaRef.id} -> ${lambdaRef.filepath} ${lambdaRef.handlerLocation.filepath} ${lambdaRef.handlerLocation.exportKey}`,
    );

    // Grant the lambda access to each of its dependencies.
    for (const { construct, clientRef } of dependencies) {
      if ('grantLambdaAccess' in construct) {
        construct.grantLambdaAccess?.(
          this,
          'options' in clientRef ? clientRef.options : undefined,
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

  grantLambdaAccess(lambda: AediLambdaFunction): void {
    this.lambdaFunction.grantInvoke(lambda.lambdaFunction);
  }
}
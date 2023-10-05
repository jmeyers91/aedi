import { Construct } from 'constructs';
import { resolveConstruct, isLambdaDependency } from '../aedi-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Function, FunctionProps } from 'aws-cdk-lib/aws-lambda';
import { TypeScriptCode } from '@mrgrain/cdk-esbuild';
import {
  ClientRef,
  AediAppHandlerEnv,
  LambdaConstructRef,
  LambdaRef,
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

    const dependencies: {
      clientRef: ClientRef;
      construct: ILambdaDependency<any> | Construct;
    }[] = [];
    const environment: Omit<AediAppHandlerEnv, 'AEDI_CONSTRUCT_UID_MAP'> &
      Record<`AEDI_REF_${string}`, string> = {
      AEDI_FUNCTION_ID: lambdaRef.id,
      AEDI_FUNCTION_UID: lambdaRef.uid,
    };

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
          const envKey = `AEDI_REF_${ref.uid
            .replace(/-/g, '_')
            .replace(/\./g, '__')}` as const;
          const constructRef = construct.getConstructRef();

          environment[envKey] =
            typeof constructRef === 'string'
              ? constructRef
              : JSON.stringify(construct.getConstructRef());
        }

        dependencies.push({ construct, clientRef });
      }
    }

    if (!lambdaRef.handlerLocation) {
      throw new Error(
        `Unable to resolve lambda handler location: ${lambdaRef.uid}`,
      );
    }

    const baseFunctionProps: FunctionProps = {
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(lambdaRef.timeout ?? 15),
      handler: lambdaRef.handlerLocation.exportKey,
      code: new TypeScriptCode(lambdaRef.handlerLocation.filepath, {
        buildOptions: {
          outfile: 'index.js',
        },
      }),
      environment: environment,
      memorySize: lambdaRef.memorySize,
    };

    // Allow each dependency resource the opportunity to extend the function props
    const transformedFunctionProps = dependencies
      .map((it) => it.construct)
      .filter(isLambdaDependency)
      .reduce(
        (props, construct) => construct.transformLambdaProps?.(props) ?? props,
        baseFunctionProps,
      );

    // Create the nodejs function
    const fn = new Function(this, 'function', transformedFunctionProps);
    this.lambdaFunction = fn;

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

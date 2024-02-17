import { Construct } from 'constructs';
import {
  resolveConstruct,
  isComputeDependency,
  createComputeDependencyEnv,
  NotReadOnly,
} from '../aedi-infra-utils';
import { Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Function, FunctionProps } from 'aws-cdk-lib/aws-lambda';
import { TypeScriptCode } from '@mrgrain/cdk-esbuild';
import { LambdaConstructRef, LambdaRef, RefType } from '@aedi/common';
import { IComputeDependency } from '../aedi-infra-types';
import { AediBaseConstruct } from '../aedi-base-construct';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import {
  Connections,
  IConnectable,
  Port,
  SecurityGroup,
} from 'aws-cdk-lib/aws-ec2';

export class AediLambdaFunction
  extends AediBaseConstruct<RefType.LAMBDA>
  implements IComputeDependency<LambdaConstructRef>
{
  public readonly lambdaFunction;
  public readonly lambdaRef: LambdaRef<any, any, any>;
  public readonly connections?: Connections;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: LambdaRef<any, any, any> },
  ) {
    // TODO: Add support for lambdas in VPCs - make this class implement IConnectable
    super(scope, id, props);

    const lambdaRef = (this.lambdaRef = this.resourceRef);

    const { dependencies, environment } = createComputeDependencyEnv(
      lambdaRef,
      lambdaRef.context,
    );

    if (!lambdaRef.handlerLocation) {
      throw new Error(
        `Unable to resolve lambda handler location: ${lambdaRef.uid}`,
      );
    }

    const baseFunctionProps: NotReadOnly<FunctionProps> = {
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

    if (lambdaRef.vpc) {
      const { vpc } = resolveConstruct(lambdaRef.vpc);
      const securityGroup = new SecurityGroup(this, 'security-group', {
        vpc,
      });
      baseFunctionProps.vpc = vpc;
      baseFunctionProps.securityGroups = [securityGroup];
      this.connections = new Connections({
        securityGroups: [securityGroup],
        defaultPort: Port.tcp(443),
      });
    }

    // Allow each dependency resource the opportunity to extend the function props
    const transformedFunctionProps = dependencies
      .map((it) => it.construct)
      .filter(isComputeDependency)
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
      const options = 'options' in clientRef ? clientRef.options : undefined;

      if ('grantComputeAccess' in construct) {
        construct.grantComputeAccess?.(this.lambdaFunction, options);
      }

      if (this.connections && 'grantComputeNetworkAccess' in construct) {
        construct.grantComputeNetworkAccess?.(this as IConnectable, options);
      }
    }
  }

  getConstructRef() {
    return {
      functionName: this.lambdaFunction.functionName,
      region: Stack.of(this).region,
    };
  }

  grantComputeAccess(grantable: IGrantable): void {
    this.lambdaFunction.grantInvoke(grantable);
  }

  grantComputeNetworkAccess(connectable: IConnectable): void {
    if (this.connections) {
      this.connections.allowDefaultPortFrom(connectable);
    }
  }
}

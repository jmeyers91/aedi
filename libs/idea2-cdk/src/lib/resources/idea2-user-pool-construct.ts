/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import { UserPoolRef, UserPoolConstructRef } from '@sep6/idea2';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { UserPool, UserPoolTriggers } from 'aws-cdk-lib/aws-cognito';
import { Idea2LambdaFunction } from './idea2-lambda-construct';
import { ILambdaDependency } from '../idea2-infra-types';
import { createConstructName, resolveConstruct } from '../idea2-infra-utils';

export class Idea2UserPool
  extends Construct
  implements ILambdaDependency<UserPoolConstructRef>
{
  public readonly userPool: UserPool;
  public readonly userPoolRef: UserPoolRef;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: userPoolRef }: { resourceRef: UserPoolRef }
  ) {
    super(scope, id);

    this.userPoolRef = userPoolRef;

    const lambdaTriggers: UserPoolTriggers = {};

    for (const [triggerName, triggerLambdaRef] of Object.entries(
      userPoolRef.triggers ?? {}
    )) {
      lambdaTriggers[triggerName] = resolveConstruct(
        this,
        triggerLambdaRef
      ).lambdaFunction;
    }

    this.userPool = new UserPool(this, id, {
      userPoolName: createConstructName(this, userPoolRef),
      signInAliases: { email: true },
      selfSignUpEnabled: userPoolRef.selfSignUpEnabled,
      removalPolicy: RemovalPolicy.DESTROY, // TODO: Configurable
      lambdaTriggers,
    });

    this.userPool.addDomain('domain', {
      cognitoDomain: {
        domainPrefix: userPoolRef.domainPrefix,
      },
    });
  }

  getConstructRef() {
    return {
      userPoolId: this.userPool.userPoolId,
      region: Stack.of(this).region,
    };
  }

  grantLambdaAccess(lambda: Idea2LambdaFunction): void {
    this.userPool.grant(lambda.lambdaFunction, 'cognito-idp:*');
  }
}

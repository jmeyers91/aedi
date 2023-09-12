/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import { UserPoolRef, RefType } from '@sep6/idea2';
import { getIdea2StackContext } from './idea2-infra-utils';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { UserPool, UserPoolTriggers } from 'aws-cdk-lib/aws-cognito';
import { Idea2LambdaFunction } from './idea2-lambda-construct';

export class Idea2UserPool extends Construct {
  static cachedFactory(
    scope: Construct,
    userPoolRef: UserPoolRef
  ): Idea2UserPool {
    const cache = getIdea2StackContext(scope).getCache<Idea2UserPool>(
      RefType.USER_POOL
    );
    const cached = cache.get(userPoolRef.id);
    if (cached) {
      return cached;
    }
    const userPool = new Idea2UserPool(
      Stack.of(scope),
      `user-pool-${userPoolRef.id}`,
      {
        userPoolRef,
      }
    );
    cache.set(userPoolRef.id, userPool);
    return userPool;
  }

  public readonly userPool: UserPool;

  constructor(
    scope: Construct,
    id: string,
    { userPoolRef }: { userPoolRef: UserPoolRef }
  ) {
    super(scope, id);

    const lambdaTriggers: UserPoolTriggers = {};

    for (const [triggerName, triggerLambdaRef] of Object.entries(
      userPoolRef.triggers ?? {}
    )) {
      lambdaTriggers[triggerName] = Idea2LambdaFunction.cachedFactory(
        this,
        triggerLambdaRef
      ).lambdaFunction;
    }

    this.userPool = new UserPool(this, id, {
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
}

import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { UserPool, UserPoolProps } from 'aws-cdk-lib/aws-cognito';
import { MergedNestResourceNode, ResourceType } from '@sep6/utils';

export class AppUserPool extends UserPool {
  public readonly userPoolResource;

  constructor(
    scope: Construct,
    id: string,
    {
      domainPrefix,
      userPoolResource,
      ...rest
    }: {
      domainPrefix: string;
      userPoolResource: MergedNestResourceNode<ResourceType.USER_POOL>;
    } & Omit<UserPoolProps, 'signInAliases' | 'selfSignUpEnabled'>
  ) {
    super(scope, id, {
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY,
      ...rest,
    });

    this.userPoolResource = userPoolResource;

    this.addDomain('domain', {
      cognitoDomain: {
        domainPrefix,
      },
    });
  }
}

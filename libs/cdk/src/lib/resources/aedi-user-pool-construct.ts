import { Construct } from 'constructs';
import { UserPoolRef, UserPoolConstructRef, RefType } from '@aedi/common';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  UserPool,
  UserPoolTriggers,
} from 'aws-cdk-lib/aws-cognito';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { ILambdaDependency } from '../aedi-infra-types';
import { resolveConstruct } from '../aedi-infra-utils';
import { Role, WebIdentityPrincipal } from 'aws-cdk-lib/aws-iam';
import { AediBaseConstruct } from '../aedi-base-construct';

export class AediUserPool
  extends AediBaseConstruct<RefType.USER_POOL>
  implements ILambdaDependency<UserPoolConstructRef>
{
  public readonly userPool: UserPool;
  public readonly userPoolRef: UserPoolRef;
  public readonly userPoolClientId: string;
  public readonly identityPoolId: string;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: UserPoolRef },
  ) {
    super(scope, id, props);

    const userPoolRef = (this.userPoolRef = this.resourceRef);

    const lambdaTriggers: UserPoolTriggers = {};

    for (const [triggerName, triggerLambdaRef] of Object.entries(
      userPoolRef.triggers ?? {},
    )) {
      lambdaTriggers[triggerName] =
        resolveConstruct(triggerLambdaRef).lambdaFunction;
    }

    this.userPool = new UserPool(this, id, {
      // TODO: Add additional user pool options
      signInAliases: userPoolRef.signInAlias,
      selfSignUpEnabled: userPoolRef.selfSignUpEnabled,
      removalPolicy: RemovalPolicy.DESTROY, // TODO: Configurable
      lambdaTriggers,
    });

    const client = this.userPool.addClient('client');
    this.userPoolClientId = client.userPoolClientId;

    const identityPool = new CfnIdentityPool(this, 'cognito-user-restriction', {
      identityPoolName: `${userPoolRef.uid.replace(/\./g, '-')}-identity-pool`,
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: client.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });
    this.identityPoolId = identityPool.ref;

    const guestRole = new Role(this, 'cognito-user-pool-unauthed', {
      assumedBy: new WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'unauthenticated',
        },
      }),
    });

    const authedRole = new Role(this, 'cognito-user-pool-authed', {
      assumedBy: new WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated',
        },
      }),
    });

    new CfnIdentityPoolRoleAttachment(
      this,
      'cognito-user-pool-role-attachment',
      {
        identityPoolId: identityPool.ref,
        roles: {
          unauthenticated: guestRole.roleArn,
          authenticated: authedRole.roleArn,
        },
        roleMappings: {
          mapping: {
            type: 'Token',
            ambiguousRoleResolution: 'AuthenticatedRole',
            identityProvider: `cognito-idp.${
              Stack.of(this).region
            }.amazonaws.com/${this.userPool.userPoolId}:${
              client.userPoolClientId
            }`,
          },
        },
      },
    );

    this.userPool.addDomain('domain', {
      cognitoDomain: {
        domainPrefix: userPoolRef.domainPrefix,
      },
    });
  }

  getConstructRef(): UserPoolConstructRef {
    return {
      userPoolId: this.userPool.userPoolId,
      region: Stack.of(this).region,
      userPoolClientId: this.userPoolClientId,
      identityPoolId: this.identityPoolId,
    };
  }

  grantLambdaAccess(lambda: AediLambdaFunction): void {
    this.userPool.grant(lambda.lambdaFunction, 'cognito-idp:*');
  }
}

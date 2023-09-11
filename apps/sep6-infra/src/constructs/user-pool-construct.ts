import { Construct } from 'constructs';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  UserPool,
  UserPoolClient,
  UserPoolProps,
} from 'aws-cdk-lib/aws-cognito';
import { MergedNestResourceNode, ResourceType } from '@sep6/utils';
import { Role, WebIdentityPrincipal } from 'aws-cdk-lib/aws-iam';

export interface IdentityPoolInfo {
  identityPoolId: string;
  identityPool: CfnIdentityPool;
  guestRole: Role;
  authedRole: Role;
  identityRoleAttachment: CfnIdentityPoolRoleAttachment;
}

export class UserPoolConstruct extends UserPool {
  public readonly identityPools: IdentityPoolInfo[] = [];
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

  addClientIdentityPool(
    identityPoolName: string,
    client: UserPoolClient
  ): IdentityPoolInfo {
    const scope = new Construct(this, `identity-pool-${identityPoolName}`);
    const identityPool = new CfnIdentityPool(
      scope,
      'cognito-user-restriction',
      {
        identityPoolName,
        allowUnauthenticatedIdentities: true,
        cognitoIdentityProviders: [
          {
            clientId: client.userPoolClientId,
            providerName: this.userPoolProviderName,
          },
        ],
      }
    );
    const identityPoolId = identityPool.ref;

    const guestRole = new Role(scope, 'cognito-user-pool-unauthed', {
      assumedBy: new WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'unauthenticated',
        },
      }),
    });

    const authedRole = new Role(scope, 'cognito-user-pool-authed', {
      assumedBy: new WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated',
        },
      }),
    });

    const identityRoleAttachment = new CfnIdentityPoolRoleAttachment(
      scope,
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
              Stack.of(scope).region
            }.amazonaws.com/${this.userPoolId}:${client.userPoolClientId}`,
          },
        },
      }
    );

    const identityPoolInfo: IdentityPoolInfo = {
      identityPoolId,
      identityPool,
      guestRole,
      authedRole,
      identityRoleAttachment,
    };

    this.identityPools.push(identityPoolInfo);

    return identityPoolInfo;
  }
}

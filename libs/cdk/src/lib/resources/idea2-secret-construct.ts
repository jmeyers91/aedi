import { Construct } from 'constructs';
import { ILambdaDependency } from '../idea2-infra-types';
import { Idea2LambdaFunction } from './idea2-lambda-construct';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RefType, SecretConstructRef, SecretRef } from '@aedi/common';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ParamsAndSecretsLayerVersion,
  ParamsAndSecretsVersions,
} from 'aws-cdk-lib/aws-lambda';
import { Idea2BaseConstruct } from '../idea2-base-construct';

export class Idea2Secret
  extends Idea2BaseConstruct<RefType.SECRET>
  implements ILambdaDependency<SecretConstructRef>
{
  public readonly secretRef: SecretRef;
  public readonly secret: ISecret;

  constructor(scope: Construct, id: string, props: { resourceRef: SecretRef }) {
    super(scope, id, props);

    const secretRef = (this.secretRef = this.resourceRef);

    this.secret = Secret.fromSecretAttributes(this, 'secret', {
      secretCompleteArn: secretRef.arn,
    });
  }

  getConstructRef(): SecretConstructRef {
    return {
      secretName: this.secret.secretName,
    };
  }

  grantLambdaAccess(lambda: Idea2LambdaFunction): void {
    this.secret.grantRead(lambda.lambdaFunction);
  }

  transformLambdaProps(lambdaProps: NodejsFunctionProps): NodejsFunctionProps {
    if (lambdaProps.paramsAndSecrets) {
      // The secret plugin is already enabled.
      return lambdaProps;
    }

    return {
      ...lambdaProps,
      paramsAndSecrets: ParamsAndSecretsLayerVersion.fromVersion(
        ParamsAndSecretsVersions.V1_0_103,
      ),
    };
  }
}

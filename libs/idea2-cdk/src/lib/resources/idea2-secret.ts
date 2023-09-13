import { Construct } from 'constructs';
import { ILambdaDependency } from '../idea2-infra-types';
import { Idea2LambdaFunction } from './idea2-lambda';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { SecretConstructRef, SecretRef } from '@sep6/idea2';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ParamsAndSecretsLayerVersion,
  ParamsAndSecretsLogLevel,
  ParamsAndSecretsVersions,
} from 'aws-cdk-lib/aws-lambda';

export class Idea2Secret
  extends Construct
  implements ILambdaDependency<SecretConstructRef>
{
  public readonly secretRef: SecretRef;
  public readonly secret: ISecret;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: secretRef }: { resourceRef: SecretRef }
  ) {
    super(scope, id);

    this.secretRef = secretRef;

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
        ParamsAndSecretsVersions.V1_0_103
      ),
    };
  }
}

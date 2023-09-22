import { Construct } from 'constructs';
import { ILambdaDependency } from '../aedi-infra-types';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RefType, SecretConstructRef, SecretRef } from '@aedi/common';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ParamsAndSecretsLayerVersion,
  ParamsAndSecretsVersions,
} from 'aws-cdk-lib/aws-lambda';
import { AediBaseConstruct } from '../aedi-base-construct';

export class AediSecret
  extends AediBaseConstruct<RefType.SECRET>
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

  grantLambdaAccess(lambda: AediLambdaFunction): void {
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

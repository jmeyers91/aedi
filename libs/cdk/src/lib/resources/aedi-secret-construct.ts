import { Construct } from 'constructs';
import { IComputeDependency } from '../aedi-infra-types';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RefType, SecretConstructRef, SecretRef } from '@aedi/common';
import {
  FunctionProps,
  ParamsAndSecretsLayerVersion,
  ParamsAndSecretsVersions,
} from 'aws-cdk-lib/aws-lambda';
import { AediBaseConstruct } from '../aedi-base-construct';
import { IGrantable } from 'aws-cdk-lib/aws-iam';

export class AediSecret
  extends AediBaseConstruct<RefType.SECRET>
  implements IComputeDependency<SecretConstructRef>
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

  grantComputeAccess(grantable: IGrantable): void {
    this.secret.grantRead(grantable);
  }

  transformLambdaProps(lambdaProps: FunctionProps): FunctionProps {
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

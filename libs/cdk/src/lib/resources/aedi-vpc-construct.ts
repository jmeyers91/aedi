import { Construct } from 'constructs';
import { IComputeDependency } from '../aedi-infra-types';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { RefType, VpcConstructRef, VpcRef } from '@aedi/common';
import { AediBaseConstruct } from '../aedi-base-construct';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Stack } from 'aws-cdk-lib';

export class AediVpc
  extends AediBaseConstruct<RefType.VPC>
  implements IComputeDependency<VpcConstructRef>
{
  public readonly vpcRef: VpcRef;
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: { resourceRef: VpcRef }) {
    super(scope, id, props);

    this.vpcRef = this.resourceRef;

    this.vpc = new Vpc(this, 'vpc', {
      maxAzs: this.vpcRef.maxAzs ?? 2,
    });
  }

  getConstructRef(): VpcConstructRef {
    return {
      region: Stack.of(this).region,
    };
  }
}

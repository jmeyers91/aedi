import type { FunctionProps } from 'aws-cdk-lib/aws-lambda';
import type { IGrantable } from 'aws-cdk-lib/aws-iam';
import type { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import type { StaticSiteBehaviorOptions } from '@aedi/common';
import type { IConnectable } from 'aws-cdk-lib/aws-ec2';

/**
 * TODO: Rename to IComputeDependency and refactor to support other compute resources.
 */
export interface IComputeDependency<C> {
  getConstructRef(): C;

  /**
   * Called when a compute instance depends on the resource.
   * Used to grant IAM permissions to the compute instance.
   * Only applicable for resources that use IAM permissions.
   */
  grantComputeAccess?(grantable: IGrantable, options?: any): void;

  /**
   * Called when a compute instance depends on the resource.
   * Used to grant network access to the compute instance.
   * Only applicable for resources that are hosted in a VPC.
   */
  grantComputeNetworkAccess?(connectable: IConnectable, options?: any): void;

  /**
   * Used when a resource needs to manipulate the lambda's creation options rather than just
   * supply a construct ref and permissions.
   */
  transformLambdaProps?(lambdaProps: FunctionProps): FunctionProps;

  // TODO: Add a similar function for transforming fargate service props
}

export interface ICloudfrontBehaviorSource {
  addCloudfrontBehavior(
    distribution: Distribution,
    options: StaticSiteBehaviorOptions,
  ): void;
}

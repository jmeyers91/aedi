import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AediLambdaFunction } from './resources/aedi-lambda-construct';

export interface ILambdaDependency<C> {
  getConstructRef(): C;
  grantLambdaAccess?(lambda: AediLambdaFunction, options?: any): void;

  /**
   * Used when a resource needs to manipulate the lambda's creation options rather than just
   * supply a construct ref and permissions.
   */
  transformLambdaProps?(lambdaProps: NodejsFunctionProps): NodejsFunctionProps;
}

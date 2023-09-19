import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Idea2LambdaFunction } from './resources/idea2-lambda-construct';

export interface ILambdaDependency<C> {
  getConstructRef(): C;
  grantLambdaAccess?(lambda: Idea2LambdaFunction, options?: any): void;

  /**
   * Used when a resource needs to manipulate the lambda's creation options rather than just
   * supply a construct ref and permissions.
   */
  transformLambdaProps?(lambdaProps: NodejsFunctionProps): NodejsFunctionProps;
}

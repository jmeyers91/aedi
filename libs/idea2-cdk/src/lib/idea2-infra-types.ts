/* eslint-disable @typescript-eslint/no-explicit-any */
import { Idea2LambdaFunction } from './idea2-lambda-construct';

export interface ILambdaDependency<C> {
  getConstructRef(): C;
  grantLambdaAccess(lambda: Idea2LambdaFunction, options?: any): void;
}

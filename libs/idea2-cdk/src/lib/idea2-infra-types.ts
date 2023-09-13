/* eslint-disable @typescript-eslint/no-explicit-any */
import { Idea2LambdaFunction } from './resources/idea2-lambda';

export interface ILambdaDependency<C> {
  getConstructRef(): C;
  grantLambdaAccess(lambda: Idea2LambdaFunction, options?: any): void;
}

import { ConstructRefMap } from '@sep6/idea2';
import { Idea2LambdaFunction } from './idea2-lambda-construct';

export interface ILambdaDependency {
  provideConstructRef(contextRefMap: ConstructRefMap): void;
  grantLambdaAccess(lambda: Idea2LambdaFunction, options?: any): void;
}

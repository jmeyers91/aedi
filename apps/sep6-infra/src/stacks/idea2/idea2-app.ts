/* eslint-disable @typescript-eslint/no-explicit-any */

import { LambdaRef, AnyFn, DynamoRef } from './idea2-types';

export class IdeaApp {
  public readonly lambdas = new Map<string, LambdaRef<any, AnyFn>>();
  public readonly tables = new Map<string, DynamoRef<any, any>>();
}

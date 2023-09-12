/* eslint-disable @typescript-eslint/no-explicit-any */

import { LambdaRef, AnyFn } from './idea2-types';

export class IdeaApp {
  public readonly lambdas = new Map<string, LambdaRef<any, AnyFn>>();
}

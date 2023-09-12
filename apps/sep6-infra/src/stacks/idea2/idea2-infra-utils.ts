import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Idea2App } from './idea2-app';

export function getIdea2StackContext(construct: Construct): Idea2StackContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Stack.of(construct) as any;
}

export function getNamePrefix(construct: Construct): string {
  return getIdea2StackContext(construct).namePrefix ?? '';
}

export function createConstructName(scope: Construct, name: string): string {
  return `${getNamePrefix(scope)}${name}`;
}

export interface Idea2StackContext {
  idea2App: Idea2App;
  namePrefix?: string;
  getCache<T>(cacheId: string): Map<string, T>;
}

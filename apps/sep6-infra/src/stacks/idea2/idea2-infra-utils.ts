import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RefType } from './idea2-types';

export function getIdea2StackContext(construct: Construct): Idea2StackContext {
  return Stack.of(construct) as any;
}

export function getNamePrefix(construct: Construct): string {
  return getIdea2StackContext(construct).namePrefix ?? '';
}

export function createConstructName(scope: Construct, name: string): string {
  return `${getNamePrefix(scope)}${name}`;
}

export interface Idea2StackContext {
  namePrefix?: string;
  getCache<T>(cacheId: string): Map<string, T>;
}

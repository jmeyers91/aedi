/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Idea2App, RefType, ResourceRef } from '@sep6/idea2';
import { Idea2Constructs, idea2Constructs } from './idea2-constructs';

export function getIdea2StackContext(construct: Construct): Idea2StackContext {
  return Stack.of(construct) as any;
}

export function getNamePrefix(construct: Construct): string {
  return getIdea2StackContext(construct).namePrefix ?? '';
}

export function createConstructName(scope: Construct, name: string): string {
  return `${getNamePrefix(scope)}${name}`;
}

export function resolveConstruct<R extends ResourceRef>(
  scope: Construct,
  resourceRef: R
): InstanceType<Idea2Constructs[R['type']]> {
  const cache = getIdea2StackContext(scope).getCache<
    Idea2Constructs[R['type']]
  >(resourceRef.type);

  const cached = cache.get(resourceRef.id);
  if (cached) {
    return cached as any;
  }

  const constructClass = getIdea2ConstructClass(resourceRef.type);
  const construct = new (constructClass as any)(
    Stack.of(scope), // Put all idea2 constructs in the root of the stack
    `${resourceRef.type}-${resourceRef.id}`,
    { resourceRef }
  );

  cache.set(resourceRef.id, construct as any);

  return construct as any;
}

export function getIdea2ConstructClass<T extends RefType>(
  refType: T
): (typeof idea2Constructs)[T] {
  return idea2Constructs[refType];
}

export interface Idea2StackContext {
  idea2App: Idea2App;
  namePrefix?: string;
  getCache<T>(cacheId: string): Map<string, T>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IResourceRef, Idea2App, RefType, ResourceRef } from '@sep6/idea2';
import { Idea2Constructs, idea2Constructs } from './idea2-constructs';
import { ILambdaDependency } from './idea2-infra-types';

export function getIdea2StackContext(construct: Construct): Idea2StackContext {
  return Stack.of(construct) as any;
}

export function getNamePrefix(construct: Construct): string {
  return getIdea2StackContext(construct).namePrefix ?? '';
}

export function createConstructName(
  scope: Construct,
  resourceRef: IResourceRef
): string {
  return `${getNamePrefix(scope)}${resourceRef.uid.replace(/\./g, '-')}`;
}

export function isLambdaDependency(
  construct: object
): construct is ILambdaDependency<any> {
  return 'grantLambdaAccess' in construct;
}

export function resolveConstruct<R extends ResourceRef>(
  scope: Construct,
  resourceRef: R
): InstanceType<Idea2Constructs[R['type']]> {
  const idea2StackContext = getIdea2StackContext(scope);

  const cached = idea2StackContext.getCachedResource(resourceRef);
  if (cached) {
    return cached as any;
  }

  const constructClass = getIdea2ConstructClass(resourceRef.type);
  const resourceRefScope = resourceRef.getScope();

  // If the resource scope is the app, use the place it in the stack
  // Otherwise, resolve the scope construct and use it
  const constructScope =
    'isIdea2App' in resourceRefScope
      ? Stack.of(scope)
      : resolveConstruct(scope, resourceRefScope as ResourceRef);

  const construct = new (constructClass as any)(
    constructScope,
    resourceRef.id,
    { resourceRef }
  );

  idea2StackContext.cacheResource(resourceRef, construct);

  return construct as any;
}

export function getIdea2ConstructClass<T extends RefType>(
  refType: T
): (typeof idea2Constructs)[T] {
  return idea2Constructs[refType];
}

export function isResourceRef(value: unknown): value is ResourceRef {
  return !!(
    value &&
    typeof value === 'object' &&
    'type' in value &&
    Object.values(RefType).includes(value.type as RefType)
  );
}

export interface Idea2StackContext {
  idea2App: Idea2App;
  namePrefix?: string;
  getCachedResource(resourceRef: IResourceRef): Construct | undefined;
  cacheResource(resourceRef: IResourceRef, resource: Construct): void;
}

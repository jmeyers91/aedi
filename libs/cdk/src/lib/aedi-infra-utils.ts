import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IResourceRef, AediApp, RefType, ResourceRef } from '@aedi/common';
import { AediConstructs, aediConstructs } from './aedi-constructs';
import {
  ICloudfrontBehaviorSource,
  IComputeDependency,
} from './aedi-infra-types';
import { AsyncLocalStorage } from 'async_hooks';
import { AediStack } from './resources/aedi-stack-construct';

const aediCdkAppContextStore = new AsyncLocalStorage<AediCdkAppContext>();

export function runWithAediCdkAppContext<T>(
  context: AediCdkAppContext,
  fn: () => T,
): T {
  return aediCdkAppContextStore.run(context, fn);
}

export function getAediCdkAppContext(): AediCdkAppContext {
  const context = aediCdkAppContextStore.getStore();
  if (!context) {
    throw new Error(`Unable to resolve the Aedi CDK app context.`);
  }
  return context;
}

export function getMode() {
  return getAediCdkAppContext().mode;
}

/**
 * Used to create a long hopefully unique name for resources that must be named.
 */
export function createConstructName(resourceRef: IResourceRef): string {
  return `${resourceRef.uid.replace(/\./g, '-')}`;
}

export function isComputeDependency(
  construct: object,
): construct is IComputeDependency<any> {
  return 'grantComputeAccess' in construct;
}

export function isCloudfrontBehaviorSource(
  construct: object,
): construct is ICloudfrontBehaviorSource {
  return 'addCloudfrontBehavior' in construct;
}

export function resolveConstruct<R extends ResourceRef>(
  resourceRef: R,
): InstanceType<AediConstructs[R['type']]> {
  const aediStackContext = getAediCdkAppContext();

  const cached = aediStackContext.getCachedResource(resourceRef);
  if (cached) {
    return cached as any;
  }

  const constructClass = getAediConstructClass(resourceRef.type);
  const resourceRefScope = resourceRef.getScope();
  let constructScope: Construct;

  if (isAediApp(resourceRefScope)) {
    if (resourceRef.type !== RefType.STACK) {
      throw new Error(`Resource must be in a stack: ${resourceRef.uid}`);
    }
    constructScope = aediStackContext.cdkApp;
  } else {
    constructScope = resolveConstruct(resourceRefScope as ResourceRef);
  }

  const construct = new (constructClass as any)(
    constructScope,
    resourceRef.id,
    {
      resourceRef,
    },
  );

  // Register all constructs with their stack for mapping
  if (resourceRef.type !== RefType.STACK) {
    (Stack.of(construct) as AediStack).registerResourceConstruct({
      resourceRef,
      construct,
    });
  }

  aediStackContext.cacheResource(resourceRef, construct);

  return construct as any;
}

/**
 * Finds or creates a region stack in a construct's scope.
 * The construct must be inside an Aedi stack.
 */
export function getRegionStack(construct: Construct, region: string) {
  const stack = Stack.of(construct);
  if (!(stack instanceof AediStack)) {
    throw new Error(
      `Parent stack must be an AediStack to call getRegionStack.`,
    );
  }
  return stack.getRegionStack(region);
}

/**
 * Takes an enum, an optional key, and a default key.
 * If the optional key is passed, its enum value is returned.
 * Otherwise, the default enum value is returned.
 *
 * Used to pass CDK enums from the Aedi core without having to reference any
 * of the CDK enum types directly.
 */
export function fromEnumKey<E, K extends keyof E, D extends keyof E>(
  enumDef: E,
  key: K | undefined,
  defaultKey: D,
): E[K] | E[D] {
  return enumDef[key ?? defaultKey];
}

function isAediApp(value: unknown): value is AediApp {
  return !!(value && typeof value === 'object' && 'isAediApp' in value);
}

export function getAediConstructClass<T extends RefType>(
  refType: T,
): (typeof aediConstructs)[T] {
  return aediConstructs[refType];
}

export function isResourceRef(value: unknown): value is ResourceRef {
  return !!(
    value &&
    typeof value === 'object' &&
    'type' in value &&
    Object.values(RefType).includes(value.type as RefType)
  );
}

export interface AediCdkAppContext {
  mode: 'development' | 'production';
  aediApp: AediApp;
  cdkApp: App;
  defaultStackProps: StackProps;
  getCachedResource(resourceRef: IResourceRef): Construct | undefined;
  cacheResource(resourceRef: IResourceRef, resource: Construct): void;
}

export type NotReadOnly<T> = { -readonly [K in keyof T]: T[K] };

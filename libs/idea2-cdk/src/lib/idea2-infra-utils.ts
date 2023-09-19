import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IResourceRef, Idea2App, RefType, ResourceRef } from '@sep6/idea2';
import { Idea2Constructs, idea2Constructs } from './idea2-constructs';
import { ILambdaDependency } from './idea2-infra-types';
import { AsyncLocalStorage } from 'async_hooks';
import { Idea2Stack } from './resources/idea2-stack-construct';

const idea2CdkAppContextStore = new AsyncLocalStorage<Idea2CdkAppContext>();

export function runWithIdea2CdkAppContext<T>(
  context: Idea2CdkAppContext,
  fn: () => T
): T {
  return idea2CdkAppContextStore.run(context, fn);
}

export function getIdea2CdkAppContext(): Idea2CdkAppContext {
  const context = idea2CdkAppContextStore.getStore();
  if (!context) {
    throw new Error(`Unable to resolve the Idea2 CDK app context.`);
  }
  return context;
}

/**
 * Used to create a long hopefully unique name for resources that must be named.
 */
export function createConstructName(resourceRef: IResourceRef): string {
  return `${resourceRef.uid.replace(/\./g, '-')}`;
}

export function isLambdaDependency(
  construct: object
): construct is ILambdaDependency<any> {
  return 'grantLambdaAccess' in construct;
}

export function resolveConstruct<R extends ResourceRef>(
  resourceRef: R
): InstanceType<Idea2Constructs[R['type']]> {
  const idea2StackContext = getIdea2CdkAppContext();

  const cached = idea2StackContext.getCachedResource(resourceRef);
  if (cached) {
    return cached as any;
  }

  const constructClass = getIdea2ConstructClass(resourceRef.type);
  const resourceRefScope = resourceRef.getScope();
  let constructScope: Construct;

  if (isIdea2App(resourceRefScope)) {
    if (resourceRef.type !== RefType.STACK) {
      throw new Error(`Resource must be in a stack: ${resourceRef.uid}`);
    }
    constructScope = idea2StackContext.cdkApp;
  } else {
    constructScope = resolveConstruct(resourceRefScope as ResourceRef);
  }

  const construct = new (constructClass as any)(
    constructScope,
    resourceRef.id,
    {
      resourceRef,
    }
  );

  // Register all constructs with their stack for mapping
  if (resourceRef.type !== RefType.STACK) {
    (Stack.of(construct) as Idea2Stack).registerResourceConstruct({
      resourceRef,
      construct,
    });
  }

  idea2StackContext.cacheResource(resourceRef, construct);

  return construct as any;
}

function isIdea2App(value: unknown): value is Idea2App {
  return !!(value && typeof value === 'object' && 'isIdea2App' in value);
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

export interface Idea2CdkAppContext {
  idea2App: Idea2App;
  cdkApp: App;
  defaultStackProps: StackProps;
  getCachedResource(resourceRef: IResourceRef): Construct | undefined;
  cacheResource(resourceRef: IResourceRef, resource: Construct): void;
}

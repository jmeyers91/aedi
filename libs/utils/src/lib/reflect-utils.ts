import { DynamicModule, Type } from '@nestjs/common';
import {
  RequestMethodString,
  getRequestMethodString,
} from './request-method-utils';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { reflector } from './reflector';
import {
  ResourceMetadata,
  ResourceType,
  getResourceMetadata,
} from './decorators/resource-module';
import { mergeDynamoMetadata } from './decorators/dynamo-module';
import {
  COGNITO_AUTHORIZER,
  CognitoAuthorizerRouteMetadata,
  DISABLE_COGNITO_AUTHORIZER,
} from './decorators/cognito-authorizer-guard';
import { mergeBucketMetadata } from './decorators/bucket-module';

export type NestModule = (() => any) | Type<any> | DynamicModule;
export type NestController = (() => any) | Type<any>;
export type NestProvider = (() => any) | Type<any>;

export interface NestNode {
  parent: NestNode | null;
  name: string;
  module: NestModule;
  imports: NestModule[];
  controllers: NestControllerInfo[];
  providers: NestProvider[];
  exports: (NestProvider | NestModule)[];
}

export interface NestResourceNode<T extends ResourceType = ResourceType>
  extends NestNode {
  resourceMetadata: Extract<ResourceMetadata, { type: T }>;
}

export interface MergedNestResourceNode<T extends ResourceType> {
  resourceId: string;
  resourceNodes: NestResourceNode<T>[];
  mergedMetadata: ResourceMetadata<T>;
}

export interface NestRouteInfo {
  name: string | symbol;
  controller: NestController;
  method: RequestMethodString;
  path: string;
  apiGatewayPath: string;
  cognitoAuthorizer?: CognitoAuthorizerRouteMetadata;
}

export interface NestControllerInfo {
  controller: NestController;
  name: string;
  routes: NestRouteInfo[];
}

export function getNestNode(module: NestModule): NestNode {
  if ('module' in module) {
    const dynamicParent = getNestNode(module.module);
    return {
      module,
      parent: null,
      name: module.module.name,
      imports: [
        ...dynamicParent.imports,
        ...((module.imports ?? []) as NestModule[]),
      ],
      controllers: [
        ...dynamicParent.controllers,
        ...(module.controllers ?? ([] as NestController[])).map((controller) =>
          getNestControllerInfo(controller)
        ),
      ],
      providers: [
        ...dynamicParent.providers,
        ...((module.providers ?? []) as NestProvider[]),
      ],
      exports: [
        ...dynamicParent.exports,
        ...((module.exports ?? []) as NestNode['exports']),
      ],
    };
  }

  const imports = (
    reflector.get<NestModule[] | undefined>('imports', module) ?? []
  ).filter((other) => other !== module);
  const controllers = (
    reflector.get<NestController[] | undefined>('controllers', module) ?? []
  ).map(getNestControllerInfo);
  const providers =
    reflector.get<NestProvider[] | undefined>('providers', module) ?? [];
  const moduleExports =
    reflector.get<(NestProvider | NestModule)[] | undefined>(
      'providers',
      module
    ) ?? [];

  return {
    name: module.name,
    parent: null,
    module,
    imports,
    controllers,
    providers,
    exports: moduleExports,
  };
}

export function getModuleName(module: NestModule): string {
  return 'module' in module ? module.module.name : module.name;
}

export function walkModule(
  module: NestModule,
  fn: (node: NestNode, depth: number) => void,
  parent: NestNode | null = null,
  depth = 0,
  visited = new Set<NestModule>()
): void {
  if (visited.has(module)) {
    return;
  }
  visited.add(module);

  const node = getNestNode(module);
  if (parent) {
    node.parent = parent;
  }
  fn(node, depth);

  for (const importedModule of node.imports) {
    walkModule(importedModule, fn, node, depth + 1, visited);
  }
}

export function flatMapModule<T>(
  module: NestModule,
  fn: (node: NestNode, depth: number) => T[]
): T[] {
  const results: T[] = [];
  walkModule(module, (node, depth) => {
    results.push(...fn(node, depth));
  });
  return results;
}

export function searchUpModuleTree(
  node: NestNode | null | undefined,
  fn: (node: NestNode) => boolean
): NestNode | undefined {
  if (!node) {
    return undefined;
  }
  if (fn(node)) {
    return node;
  }
  return searchUpModuleTree(node.parent, fn);
}

export function collectModuleControllers(
  module: NestModule
): NestControllerInfo[] {
  return flatMapModule(module, (node) => node.controllers);
}

export function collectModuleRoutes(module: NestModule): NestRouteInfo[] {
  return collectModuleControllers(module).flatMap(
    (controller) => controller.routes
  );
}

export function collectModuleResources<T extends ResourceType = ResourceType>(
  module: NestModule,
  type?: T
): NestResourceNode<T>[] {
  return flatMapModule(module, (node) => {
    const resourceMetadata = getResourceMetadata(node.module);
    if (!resourceMetadata) {
      return [];
    }
    if (type && resourceMetadata.type !== type) {
      return [];
    }
    return [{ ...node, resourceMetadata }] as NestResourceNode<T>[];
  });
}

export function isResourceMetadataType<T extends ResourceType>(
  value: ResourceMetadata<any>,
  resourceType: T
): value is ResourceMetadata<T> {
  return value.type === resourceType;
}

export function mergeResourceMetadata<
  T extends ResourceType,
  A extends ResourceMetadata<T>
>(a: A, b: ResourceMetadata<T>): A {
  if (
    isResourceMetadataType(a, ResourceType.DYNAMO_TABLE) ||
    isResourceMetadataType(b, ResourceType.DYNAMO_TABLE)
  ) {
    return mergeDynamoMetadata(a as any, b as any) as any;
  }
  if (
    isResourceMetadataType(a, ResourceType.S3_BUCKET) ||
    isResourceMetadataType(b, ResourceType.S3_BUCKET)
  ) {
    return mergeBucketMetadata(a as any, b as any) as any;
  }

  return { ...a, ...b };
}

export function collectMergedModuleResources<T extends ResourceType>(
  module: NestModule,
  type: T
): MergedNestResourceNode<T>[] {
  const moduleResources = collectModuleResources(module, type);
  // Group resource nodes by type
  const resourceIdMap = new Map<string, NestResourceNode<T>[]>();
  for (const moduleResource of moduleResources) {
    let resourceArray = resourceIdMap.get(moduleResource.resourceMetadata.id);
    if (!Array.isArray(resourceArray)) {
      resourceArray = [];
      resourceIdMap.set(moduleResource.resourceMetadata.id, resourceArray);
    }
    resourceArray.push(moduleResource);
  }
  return Array.from(resourceIdMap.keys()).map((resourceId) => {
    const resourceNodes = resourceIdMap.get(resourceId) ?? [];
    let mergedMetadata: ResourceMetadata<T> = {
      ...resourceNodes[0].resourceMetadata,
    } as any;

    for (const other of resourceNodes.slice(1)) {
      mergedMetadata = mergeResourceMetadata(
        mergedMetadata as any,
        other.resourceMetadata as any
      );
    }

    return {
      resourceId,
      resourceNodes,
      mergedMetadata,
    };
  });
}

export function getNestControllerInfo(
  controller: NestController
): NestControllerInfo {
  const controllerPathParts = (
    reflector.get<string | undefined>(PATH_METADATA, controller) ?? ''
  ).split('/');
  const disableControllerCognitoAuthorizer = reflector.get<boolean | undefined>(
    DISABLE_COGNITO_AUTHORIZER,
    controller
  );
  const controllerCognitoAuthorizer = reflector.get<
    CognitoAuthorizerRouteMetadata | undefined
  >(COGNITO_AUTHORIZER, controller);
  const routes: NestRouteInfo[] = [];
  const controllerKeys = [
    ...Object.getOwnPropertyNames(controller.prototype),
    ...Object.getOwnPropertySymbols(controller.prototype),
  ];

  for (const key of controllerKeys) {
    const value = controller.prototype[key as keyof typeof controller];

    if (typeof value !== 'function') {
      continue;
    }
    const method = reflector.get<RequestMethod | undefined>(
      METHOD_METADATA,
      value
    );
    if (typeof method !== 'number') {
      continue;
    }

    const disableMethodCognitoAuthorizer =
      disableControllerCognitoAuthorizer ??
      reflector.get<boolean | undefined>(DISABLE_COGNITO_AUTHORIZER, value);

    const cognitoAuthorizer = disableMethodCognitoAuthorizer
      ? undefined
      : reflector.get<CognitoAuthorizerRouteMetadata | undefined>(
          COGNITO_AUTHORIZER,
          value
        ) ?? controllerCognitoAuthorizer;

    const relativePathParts = (
      reflector.get<string | undefined>(PATH_METADATA, value) ?? ''
    ).split('/');

    const allPathParts = [...controllerPathParts, ...relativePathParts].filter(
      (it) => it.length > 0
    );

    let path = allPathParts.join('/');
    let apiGatewayPath = allPathParts
      .map((part) => (part[0] === ':' ? `{${part.slice(1)}}` : part))
      .join('/');

    if (path.length === 0) {
      path = '/';
    }

    apiGatewayPath = '/' + apiGatewayPath;

    routes.push({
      controller,
      name: key,
      method: getRequestMethodString(method),
      path,
      apiGatewayPath,
      cognitoAuthorizer,
    });
  }

  return {
    name: controller.name,
    controller,
    routes,
  };
}

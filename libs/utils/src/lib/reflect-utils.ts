/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RequestMethodString,
  getRequestMethodString,
} from './request-method-utils';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';

export const reflector = new Reflector();

export type NestModule = (() => any) | Type<any>;
export type NestController = (() => any) | Type<any>;
export type NestProvider = (() => any) | Type<any>;

export interface NestNode {
  name: string;
  module: NestModule;
  imports: NestModule[];
  controllers: NestController[];
  providers: NestProvider[];
  exports: (NestProvider | NestModule)[];
}

export interface NestRouteInfo {
  name: string | symbol;
  method: RequestMethodString;
  path: string;
}

export interface NestControllerInfo {
  controller: NestController;
  name: string;
  routes: NestRouteInfo[];
}

export function getNestNode(module: NestModule): NestNode {
  const imports = (
    reflector.get<NestModule[] | undefined>('imports', module) ?? []
  ).filter((other) => other !== module);
  const controllers =
    reflector.get<NestController[] | undefined>('controllers', module) ?? [];
  const providers =
    reflector.get<NestProvider[] | undefined>('providers', module) ?? [];
  const moduleExports =
    reflector.get<(NestProvider | NestModule)[] | undefined>(
      'providers',
      module
    ) ?? [];

  return {
    name: module.name,
    module,
    imports,
    controllers,
    providers,
    exports: moduleExports,
  };
}

export function walkModule(
  module: NestModule,
  fn: (node: NestNode, depth: number) => void,
  depth = 0,
  visited = new Set<NestModule>()
): void {
  if (visited.has(module)) {
    return;
  }
  visited.add(module);

  const node = getNestNode(module);
  fn(node, depth);

  for (const importedModule of node.imports) {
    walkModule(importedModule, fn, depth + 1, visited);
  }
}

export function filterModule(
  module: NestModule,
  filterFn: (node: NestNode, depth: number) => boolean
): NestNode[] {
  return flatMapModule(module, (node, depth) =>
    filterFn(node, depth) ? [node] : []
  );
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

export function getNestControllerInfo(
  controller: NestController
): NestControllerInfo {
  const controllerPathParts = (
    reflector.get<string | undefined>(PATH_METADATA, controller) ?? ''
  ).split('/');
  const routes: NestRouteInfo[] = [];

  for (const key of [
    ...Object.getOwnPropertyNames(controller.prototype),
    ...Object.getOwnPropertySymbols(controller.prototype),
  ]) {
    const value = controller.prototype[key as keyof typeof controller];
    if (typeof value !== 'function') {
      continue;
    }
    const method = reflector.get<RequestMethod | undefined>(
      METHOD_METADATA,
      value
    );
    if (!method) {
      continue;
    }
    const pathParts = (
      reflector.get<string | undefined>(PATH_METADATA, value) ?? ''
    ).split('/');
    routes.push({
      name: key,
      method: getRequestMethodString(method),
      path: [...controllerPathParts, ...pathParts]
        .filter((it) => it.length > 0)
        .join('/'),
    });
  }

  return {
    name: controller.name,
    controller,
    routes,
  };
}

export function callsites(): NodeJS.CallSite[] {
  const _prepareStackTrace = Error.prepareStackTrace;
  try {
    let result: NodeJS.CallSite[] = [];
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
      return callSitesWithoutCurrent;
    };
    new Error().stack;
    return result;
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}

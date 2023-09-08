/* eslint-disable @typescript-eslint/no-explicit-any */
import { Module, ModuleMetadata, Type, applyDecorators } from '@nestjs/common';
import { callsites } from '../reflect-utils';
import {
  LambdaMetadata,
  Resource,
  ResourceType,
  getResourceMetadata,
} from './resource-module';

export function LambdaModule({
  lambda: partialLambdaMetadata = {},
  ...metadata
}: ModuleMetadata & { lambda?: Partial<LambdaMetadata> }) {
  const handlerFilePath =
    partialLambdaMetadata.handlerFilePath ?? callsites()[1]?.getFileName();

  if (!handlerFilePath) {
    throw new Error(`Unable to find lambda handler`);
  }

  return applyDecorators(
    Resource({ type: ResourceType.LAMBDA_FUNCTION, handlerFilePath }),
    Module(metadata)
  );
}

export function getLambdaMetadata(module: Type<any> | (() => void)) {
  return getResourceMetadata(module, ResourceType.LAMBDA_FUNCTION);
}

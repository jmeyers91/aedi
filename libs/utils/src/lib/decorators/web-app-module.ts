import { ModuleMetadata, applyDecorators, Module } from '@nestjs/common';
import { ResourceType, Resource, WebAppMetadata } from './resource-module';

export function WebAppModule(
  partialMetadata: Omit<WebAppMetadata, 'type'>,
  moduleMetadata: ModuleMetadata = {}
) {
  const metadata: WebAppMetadata = {
    ...partialMetadata,
    type: ResourceType.WEB_APP,
  };
  return applyDecorators(Resource(metadata), Module(moduleMetadata));
}

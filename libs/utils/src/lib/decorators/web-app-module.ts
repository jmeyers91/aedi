import { ModuleMetadata, applyDecorators } from '@nestjs/common';
import {
  ResourceType,
  ResourceModule,
  WebAppMetadata,
} from './resource-module';

export function WebAppModule(
  partialMetadata: Omit<WebAppMetadata, 'type'>,
  moduleMetadata: ModuleMetadata = {}
) {
  const metadata: WebAppMetadata = {
    ...partialMetadata,
    type: ResourceType.WEB_APP,
  };
  return applyDecorators(ResourceModule(metadata, moduleMetadata));
}

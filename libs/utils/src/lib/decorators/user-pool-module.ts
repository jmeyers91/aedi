import { ModuleMetadata, applyDecorators, Module } from '@nestjs/common';
import { ResourceType, Resource, UserPoolMetadata } from './resource-module';

export function UserPoolModule(
  partialMetadata: Omit<UserPoolMetadata, 'type'>,
  moduleMetadata: ModuleMetadata = {}
) {
  const metadata: UserPoolMetadata = {
    ...partialMetadata,
    type: ResourceType.USER_POOL,
  };
  return applyDecorators(Resource(metadata), Module(moduleMetadata));
}

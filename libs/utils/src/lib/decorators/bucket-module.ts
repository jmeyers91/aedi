/* eslint-disable @typescript-eslint/no-explicit-any */
import { Module, ModuleMetadata, Type, applyDecorators } from '@nestjs/common';
import {
  BucketMetadata,
  Resource,
  ResourceType,
  getResourceMetadata,
} from './resource-module';

export function BucketModule({
  imports,
  exports,
  controllers,
  providers,
  ...rest
}: ModuleMetadata & Omit<BucketMetadata, 'type'>) {
  return applyDecorators(
    Resource({ ...rest, type: ResourceType.S3_BUCKET }),
    Module({ imports, exports, controllers, providers })
  );
}

export function getBucketMetadata(
  module: Type<any> | (() => void)
): BucketMetadata | undefined {
  return getResourceMetadata(module, ResourceType.S3_BUCKET);
}

export class Bucket {
  constructor(public readonly metadata: BucketMetadata) {}
  async listObjects(): Promise<{ Key: string }[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async putFile(key: string, _: string) {
    console.log(`Saving file ${key} to bucket ${this.metadata.id}`);
  }

  async getFile(key: string): Promise<string | null> {
    console.log(`Retrieving file ${key} from bucket ${this.metadata.id}`);
    return null;
  }
}

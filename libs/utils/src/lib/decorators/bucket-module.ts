/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Inject,
  Module,
  ModuleMetadata,
  Type,
  applyDecorators,
} from '@nestjs/common';
import {
  DynamicResourceModule,
  BucketMetadata,
  RESOURCE_METADATA,
  Resource,
  ResourceType,
  getResourceMetadata,
} from './resource-module';

const BUCKET_METADATA = Symbol('BUCKET_METADATA');

const DEFAULT_BUCKET_PERMISSIONS: BucketMetadata['permissions'] = {
  read: true,
  write: false,
};

export function BucketModule(
  bucketProvider: {
    metadata: Omit<BucketMetadata, 'type'>;
    new (...args: any[]): BucketService;
  },
  moduleMetadata: ModuleMetadata = {}
) {
  const metadata: BucketMetadata = {
    ...bucketProvider.metadata,
    permissions: {
      ...DEFAULT_BUCKET_PERMISSIONS,
      ...bucketProvider.metadata.permissions,
    },
    type: ResourceType.S3_BUCKET,
  };
  return applyDecorators(
    Resource(metadata),
    Module({
      imports: moduleMetadata.imports,
      controllers: moduleMetadata.controllers,
      providers: [
        { provide: BUCKET_METADATA, useValue: metadata },
        bucketProvider,
        ...(moduleMetadata.providers ?? []),
      ],
      exports: [bucketProvider, ...(moduleMetadata.exports ?? [])],
    })
  );
}

export function getBucketMetadata(
  module: Type<any> | (() => void)
): BucketMetadata | undefined {
  return getResourceMetadata(module, ResourceType.S3_BUCKET);
}

export function mergeBucketMetadata<A extends BucketMetadata>(
  a: A,
  b: BucketMetadata
): A {
  return {
    ...a,
    ...b,
    permissions: {
      read: (a.permissions?.read ?? false) || (b.permissions?.read ?? false),
      write: (a.permissions?.write ?? false) || (b.permissions?.write ?? false),
      put: (a.permissions?.put ?? false) || (b.permissions?.put ?? false),
      delete:
        (a.permissions?.delete ?? false) || (b.permissions?.delete ?? false),
    },
  };
}

export class BaseBucketModule {
  static grant(
    permissions: BucketMetadata['permissions']
  ): DynamicResourceModule<ResourceType.S3_BUCKET> {
    return {
      module: this,
      [RESOURCE_METADATA]: {
        permissions: { ...DEFAULT_BUCKET_PERMISSIONS, ...permissions },
      },
    };
  }
}

export abstract class BucketService {
  static metadata: Omit<BucketMetadata, 'type'>;

  @Inject(BUCKET_METADATA) public readonly metadata!: BucketMetadata;
}

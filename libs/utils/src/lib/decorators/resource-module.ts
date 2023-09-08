/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetMetadata, Type } from '@nestjs/common';
import { reflector } from '../reflect-utils';
import { BucketId } from '@sep6/constants';

const RESOURCE_METADATA = Symbol('RESOURCE_METADATA');

export enum ResourceType {
  LAMBDA_FUNCTION = 'LAMBDA_FUNCTION',
  S3_BUCKET = 'S3_BUCKET',
}

export interface ResourceValueMap extends Record<ResourceType, any> {
  [ResourceType.LAMBDA_FUNCTION]: {
    handlerFilePath: string;
  };

  [ResourceType.S3_BUCKET]: {
    bucketId: BucketId;
  };
}

export type ResourceMetadata<
  K extends keyof ResourceValueMap = keyof ResourceValueMap
> = {
  [K in keyof ResourceValueMap]: { type: K } & ResourceValueMap[K];
}[K];

export type LambdaMetadata = ResourceMetadata<ResourceType.LAMBDA_FUNCTION>;
export type BucketMetadata = ResourceMetadata<ResourceType.S3_BUCKET>;

export function Resource<
  K extends keyof ResourceValueMap = keyof ResourceValueMap
>(resourceMetadata: Extract<ResourceMetadata, { type: K }>) {
  return SetMetadata(RESOURCE_METADATA, resourceMetadata);
}

export function getResourceMetadata<
  K extends keyof ResourceValueMap = keyof ResourceValueMap
>(module: Type<any> | (() => void), type?: K): ResourceMetadata<K> | undefined {
  const metadata = reflector.get(RESOURCE_METADATA, module);
  if (!metadata) {
    return;
  }
  if (type && metadata.type !== type) {
    return;
  }
  return metadata;
}

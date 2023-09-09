/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamicModule, SetMetadata } from '@nestjs/common';
import { BucketId, DomainId, TableId, WebAppId } from '@sep6/constants';
import { reflector } from '../reflector';
import { NestModule, mergeResourceMetadata } from '../reflect-utils';

export const RESOURCE_METADATA = Symbol('RESOURCE_METADATA');

export enum ResourceType {
  LAMBDA_FUNCTION = 'LAMBDA_FUNCTION',
  S3_BUCKET = 'S3_BUCKET',
  DYNAMO_TABLE = 'DYNAMO_TABLE',
  WEB_APP = 'WEB_APP',
}

export enum AttributeType {
  BINARY = 'BINARY',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
}

export interface ResourceValueMap extends Record<ResourceType, object> {
  [ResourceType.LAMBDA_FUNCTION]: {
    id: string;
    handlerFilePath: string;
    domain?: DomainId;
    allowCorsDomains?: DomainId[];
  };

  [ResourceType.S3_BUCKET]: {
    id: BucketId;
  };

  [ResourceType.DYNAMO_TABLE]: {
    id: TableId;
    partitionKey: { name: string; type: AttributeType };
    sortKey?: { name: string; type: AttributeType };
    permissions?: { read?: boolean; write?: boolean };
  };

  [ResourceType.WEB_APP]: {
    id: WebAppId;
    distPath: string;
    domain?: DomainId;
  };
}

export type ResourceMetadata<
  K extends keyof ResourceValueMap = keyof ResourceValueMap
> = {
  [K in keyof ResourceValueMap]: { type: K } & ResourceValueMap[K];
}[K];

export type DynamicResourceModule<
  K extends keyof ResourceValueMap = keyof ResourceValueMap
> = DynamicModule & {
  [RESOURCE_METADATA]: Partial<Omit<ResourceMetadata<K>, 'type' | 'id'>>;
};

export type LambdaMetadata = ResourceMetadata<ResourceType.LAMBDA_FUNCTION>;
export type BucketMetadata = ResourceMetadata<ResourceType.S3_BUCKET>;
export type DynamoMetadata = ResourceMetadata<ResourceType.DYNAMO_TABLE>;
export type WebAppMetadata = ResourceMetadata<ResourceType.WEB_APP>;

export function Resource<
  K extends keyof ResourceValueMap = keyof ResourceValueMap
>(resourceMetadata: Extract<ResourceMetadata, { type: K }>) {
  return SetMetadata(RESOURCE_METADATA, resourceMetadata);
}

export function getResourceMetadata<
  K extends keyof ResourceValueMap = keyof ResourceValueMap
>(module: NestModule, type?: K): ResourceMetadata<K> | undefined {
  const dynamicModule = 'module' in module ? module : null;
  const staticModule = 'module' in module ? module.module : module;
  const staticMetadata = reflector.get(RESOURCE_METADATA, staticModule);
  const dynamicMetadata = dynamicModule
    ? (dynamicModule as { [RESOURCE_METADATA]?: ResourceMetadata })[
        RESOURCE_METADATA
      ]
    : null;

  if (!staticMetadata) {
    return;
  }

  if (type && staticMetadata.type !== type) {
    return;
  }

  return dynamicMetadata
    ? mergeResourceMetadata(staticMetadata, dynamicMetadata)
    : staticMetadata;
}

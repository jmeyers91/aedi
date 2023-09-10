/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamicModule, SetMetadata } from '@nestjs/common';
import {
  BucketId,
  DomainId,
  TableId,
  UserPoolId,
  WebAppId,
} from '@sep6/constants';
import { reflector } from '../reflector';
import { NestModule, mergeResourceMetadata } from '../reflect-utils';
import type { CfnEventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import { Context } from 'aws-lambda';

export const RESOURCE_METADATA = Symbol('RESOURCE_METADATA');

export enum ResourceType {
  LAMBDA_FUNCTION = 'LAMBDA_FUNCTION',
  S3_BUCKET = 'S3_BUCKET',
  DYNAMO_TABLE = 'DYNAMO_TABLE',
  WEB_APP = 'WEB_APP',
  USER_POOL = 'USER_POOL',
}

export enum AttributeType {
  BINARY = 'BINARY',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
}

export enum LambdaType {
  API = 'API',
  STANDARD = 'STANDARD',
}

export interface ILambdaEventHandler {
  handleLambdaEvent(event: unknown, context: Context): any;
}

export interface ResourceValueMap extends Record<ResourceType, object> {
  [ResourceType.LAMBDA_FUNCTION]: {
    id: string;
    name: string;
    lambdaType: LambdaType;
    handlerFilePath: string;
    handlerService?: { new (...args: any[]): ILambdaEventHandler };
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
    streams?: {
      lambda: any;
      batchSize?: number;
      filterPatterns?: { eventName?: string[]; [key: string]: any }[];
      filterCriteria?: CfnEventSourceMapping.FilterCriteriaProperty;
      startingPosition: 'TRIM_HORIZON' | 'LATEST';
    }[];
  };

  [ResourceType.WEB_APP]: {
    id: WebAppId;
    distPath: string;
    domain?: DomainId;
    userPool?: UserPoolId;
  };

  [ResourceType.USER_POOL]: {
    id: UserPoolId;
    lambdaTriggers?: {
      createAuthChallenge?: any; // Creates an authentication challenge.
      customEmailSender?: any; // Amazon Cognito invokes this trigger to send email notifications to users.
      customMessage?: any; // A custom Message AWS Lambda trigger.
      customSmsSender?: any; // Amazon Cognito invokes this trigger to send SMS notifications to users.
      defineAuthChallenge?: any; // Defines the authentication challenge.
      postAuthentication?: any; // A post-authentication AWS Lambda trigger.
      postConfirmation?: any; // A post-confirmation AWS Lambda trigger.
      preAuthentication?: any; // A pre-authentication AWS Lambda trigger.
      preSignUp?: any; // A pre-registration AWS Lambda trigger.
      preTokenGeneration?: any; // A pre-token-generation AWS Lambda trigger.
      userMigration?: any; // A user-migration AWS Lambda trigger.
      verifyAuthChallengeResponse?: any; // Verifies the authentication challenge response.
    };
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
export type UserPoolMetadata = ResourceMetadata<ResourceType.USER_POOL>;

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

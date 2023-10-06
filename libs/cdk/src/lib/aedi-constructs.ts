import { RefType } from '@aedi/common';
import { Construct } from 'constructs';
import { AediBucket } from './resources/aedi-bucket-construct';
import { AediConstruct } from './resources/aedi-construct-construct';
import { AediCustomResource } from './resources/aedi-custom-resource-construct';
import { AediDynamoTable } from './resources/aedi-dynamo-construct';
import { AediLambdaFunction } from './resources/aedi-lambda-construct';
import { AediRestApi } from './resources/aedi-rest-api-construct';
import { AediSecret } from './resources/aedi-secret-construct';
import { AediStack } from './resources/aedi-stack-construct';
import { AediStaticSite } from './resources/aedi-static-site-construct';
import { AediUserPool } from './resources/aedi-user-pool-construct';
import { AediFargateService } from './resources/aedi-fargate-service-construct';

export const aediConstructs = {
  [RefType.BUCKET]: AediBucket,
  [RefType.CONSTRUCT]: AediConstruct,
  [RefType.CUSTOM_RESOURCE]: AediCustomResource,
  [RefType.DYNAMO]: AediDynamoTable,
  [RefType.FARGATE_SERVICE]: AediFargateService,
  [RefType.LAMBDA]: AediLambdaFunction,
  [RefType.REST_API]: AediRestApi,
  [RefType.SECRET]: AediSecret,
  [RefType.STACK]: AediStack,
  [RefType.STATIC_SITE]: AediStaticSite,
  [RefType.USER_POOL]: AediUserPool,
} satisfies Record<RefType, { new (...args: any): Construct }>;
export type AediConstructs = typeof aediConstructs;

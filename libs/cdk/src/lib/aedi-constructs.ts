import { RefType } from '@aedi/common';
import { Construct } from 'constructs';
import { AediBucket } from './resources/aedi-bucket-construct';
import { AediDynamoTable } from './resources/aedi-dynamo-construct';
import { AediLambdaFunction } from './resources/aedi-lambda-construct';
import { AediRestApi } from './resources/aedi-rest-api-construct';
import { AediUserPool } from './resources/aedi-user-pool-construct';
import { AediStaticSite } from './resources/aedi-static-site-construct';
import { AediSecret } from './resources/aedi-secret-construct';
import { AediConstruct } from './resources/aedi-construct-construct';
import { AediStack } from './resources/aedi-stack-construct';

export const aediConstructs = {
  [RefType.BUCKET]: AediBucket,
  [RefType.CONSTRUCT]: AediConstruct,
  [RefType.DYNAMO]: AediDynamoTable,
  [RefType.LAMBDA]: AediLambdaFunction,
  [RefType.REST_API]: AediRestApi,
  [RefType.USER_POOL]: AediUserPool,
  [RefType.STACK]: AediStack,
  [RefType.SECRET]: AediSecret,
  [RefType.STATIC_SITE]: AediStaticSite,
} satisfies Record<RefType, { new (...args: any): Construct }>;
export type AediConstructs = typeof aediConstructs;

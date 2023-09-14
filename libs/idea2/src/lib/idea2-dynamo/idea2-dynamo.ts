/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DynamoClientRef, DynamoRef } from './idea2-dynamo-types';
import { CreateResourceOptions, RefType, Scope } from '../idea2-types';
import { createResource } from '../idea2-resource-utils';

export function table<T, PK extends keyof T>(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<DynamoRef<T, PK>>
) {
  return createResource(RefType.DYNAMO, scope, id, options);
}

export function grantRead<T extends DynamoRef<any, any>>(
  dynamo: T
): DynamoClientRef<T, { grantRead: true }> {
  return {
    ref: dynamo,
    refType: RefType.DYNAMO,
    options: { grantRead: true },
  };
}

export function grantWrite<T extends DynamoRef<any, any>>(
  dynamo: T
): DynamoClientRef<T, { grantWrite: true }> {
  return {
    ref: dynamo,
    refType: RefType.DYNAMO,
    options: { grantWrite: true },
  };
}

export function grantWriteOnly<T extends DynamoRef<any, any>>(
  dynamo: T
): DynamoClientRef<T, { grantWrite: true; grantRead: false }> {
  return {
    ref: dynamo,
    refType: RefType.DYNAMO,
    options: { grantWrite: true, grantRead: false },
  };
}

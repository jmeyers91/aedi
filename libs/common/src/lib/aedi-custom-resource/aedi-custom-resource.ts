import type { CustomResourceRef } from './aedi-custom-resource-types';
import { CreateResourceOptions, RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';
import { LambdaProxyHandler, lambdaProxyHandler } from '../aedi-lambda';
import { CdkCustomResourceResponse } from 'aws-lambda';

export function CustomResource<R extends CdkCustomResourceResponse>(
  scope: Scope,
  id: string,
  options: CreateResourceOptions<CustomResourceRef<R>>,
): CustomResourceRef<R> & LambdaProxyHandler {
  return Object.assign(
    createResource(RefType.CUSTOM_RESOURCE, scope, id, options),
    lambdaProxyHandler(id, [options.lambda]),
  );
}

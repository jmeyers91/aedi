import type {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse,
} from 'aws-lambda';
import { LambdaDependencyGroup, LambdaRef } from '../aedi-lambda';
import type { IResourceRef, IResourceTypeMap, RefType } from '../aedi-types';
import { defaultCustomResourceRefClientOptions } from './aedi-custom-resource-constants';

export interface CustomResourceRef<
  R extends CdkCustomResourceResponse,
  C extends LambdaDependencyGroup,
> extends IResourceRef {
  type: RefType.CUSTOM_RESOURCE;
  lambda: LambdaRef<C, CdkCustomResourceEvent, R>;
}

export interface CustomResourceClientRef<
  T extends CustomResourceRef<any, any>,
  O extends object,
> {
  refType: RefType.CUSTOM_RESOURCE;
  ref: T;
  options?: O;
}

export type CustomResourceResponse<R> = CdkCustomResourceResponse & {
  Data: {
    Result: string;
  };
  __customResourceResult?: R;
};

export interface CustomResourceConstructRef {
  result: string;
}

export interface CustomResourceRefClientOptions {
  // none?
}

export type DefaultCustomResourceRefClientOptions =
  typeof defaultCustomResourceRefClientOptions;

export interface CustomResourceTypeMap extends IResourceTypeMap {
  ref: CustomResourceRef<any, any>;
  options: CustomResourceRefClientOptions;
  defaultOptions: DefaultCustomResourceRefClientOptions;
  constructRef: CustomResourceConstructRef;
  clientRef: CustomResourceClientRef<CustomResourceRef<any, any>, any>;
}

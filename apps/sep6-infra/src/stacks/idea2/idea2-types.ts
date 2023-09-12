/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Handler } from 'aws-lambda';

export type AnyFn = (...args: any[]) => any;
export type LambdaRefFn<C> = (context: WrapContext<C>, ...args: any[]) => any;
export type WrapContext<C> = {
  [K in keyof C]: C[K] extends LambdaRef<any, any>
    ? { lambda: C[K] }
    : C[K] extends DynamoRef<any, any>
    ? { dynamo: C[K] }
    : never;
};

export enum RefType {
  LAMBDA = 'lambda',
  DYNAMO = 'dynamo',
}

export type LambdaRef<C, Fn extends LambdaRefFn<C>> = {
  type: RefType.LAMBDA;
  id: string;
  filepath: string;
  fn: Fn;
  lambdaHandler: Handler;
  context: C;
};

export type DynamoKey = 'BINARY' | 'NUMBER' | 'STRING';

export type DynamoRef<T, PK extends keyof T> = {
  type: RefType.DYNAMO;
  id: string;
  partitionKey: {
    name: PK;
    type: DynamoKey;
  };
  sortKey?: {
    name: keyof T;
    type: DynamoKey;
  };
};

export type ClientRef =
  | {
      lambda: LambdaRef<any, any>;
    }
  | { dynamo: DynamoRef<any, any> };

export interface ConstructRefMap {
  functions: Record<
    string,
    {
      functionName: string;
    }
  >;
  tables: Record<
    string,
    {
      tableName: string;
    }
  >;
}

export interface IdeaAppHandlerEnv {
  IDEA_FUNCTION_ID: string;
  IDEA_CONSTRUCT_REF_MAP: ConstructRefMap;
}

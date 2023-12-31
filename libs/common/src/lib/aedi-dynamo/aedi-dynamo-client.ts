import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommandInput,
  QueryCommand,
  ScanCommandInput,
  UpdateCommand,
  UpdateCommandInput,
  ScanCommand,
  DeleteCommandOutput,
  ScanCommandOutput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import {
  AttributeValue,
  DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import type {
  DefaultDynamoRefClientOptions,
  DynamoClientRef,
  DynamoRef,
} from './aedi-dynamo-types';
import { TransformedRef, TransformedRefScope } from '../aedi-lambda';
import { OptionsWithDefaults } from '../aedi-types';
import { once } from '../aedi-resource-utils';

export interface IReadableDynamoTable<T, PK extends keyof T> {
  get(key: { [Key in PK]: T[Key] }): Promise<T | undefined>;
  query(
    input: Omit<QueryCommandInput, 'TableName'>,
  ): Promise<{ items?: T[] } & Omit<QueryCommandOutput, 'Items'>>;

  scan(
    input: Omit<ScanCommandInput, 'TableName'>,
  ): Promise<{ items?: T[] } & Omit<ScanCommandOutput, 'Items'>>;
}

export interface IWritableDynamoTable<T, PK extends keyof T> {
  put(
    input: Omit<PutCommandInput, 'TableName' | 'Item'> & { Item: T },
  ): Promise<Partial<T>>;
  update(
    input: Omit<UpdateCommandInput, 'TableName' | 'Key'> & {
      Key: { [Key in PK]: T[Key] };
    },
  ): Promise<any>;
  patch(key: { [Key in PK]: T[Key] }, patch: Partial<T>): Promise<T>;
  delete(
    input: Omit<DeleteCommandInput, 'TableName'>,
  ): Promise<DeleteCommandOutput>;
}

type WriteableOptions = { write: true } | { fullAccess: true };
type ReadableOptions = { read: true } | { fullAccess: true };
type MaybeWritableTable<T, PK extends keyof T, O> = O extends WriteableOptions
  ? IWritableDynamoTable<T, PK>
  : object;
type MaybeReadableTable<T, PK extends keyof T, O> = O extends ReadableOptions
  ? IReadableDynamoTable<T, PK>
  : object;

// prettier-ignore
export type IDynamoTable<T, PK extends keyof T, O> = MaybeWritableTable<T, PK, O> & MaybeReadableTable<T, PK, O>;

export type DynamoEntityType<R> = R extends DynamoClientRef<
  DynamoRef<infer T, any>,
  any
>
  ? T
  : R extends DynamoRef<infer T, any>
  ? T
  : never;

export type DynamoEntityPk<R> = R extends DynamoClientRef<
  DynamoRef<any, infer PK>,
  any
>
  ? PK
  : R extends DynamoRef<any, infer PK>
  ? PK
  : never;

export type DynamoClientOptions<R> = R extends DynamoClientRef<any, infer O>
  ? OptionsWithDefaults<O, DefaultDynamoRefClientOptions>
  : DefaultDynamoRefClientOptions;

export function TableClient<
  const R extends
    | DynamoRef<any, any>
    | DynamoClientRef<DynamoRef<any, any>, any>,
>(
  ref: R,
): TransformedRef<
  R,
  IDynamoTable<DynamoEntityType<R>, DynamoEntityPk<R>, DynamoClientOptions<R>>
> {
  return {
    transformedRefScope: TransformedRefScope.STATIC,
    transformedRef: ref,
    transform: once(
      ({ constructRef }) =>
        new DynamoTable(constructRef.tableName, constructRef.region),
    ),
  };
}

export class DynamoDb extends DynamoDBDocumentClient {
  constructor(config: DynamoDBClientConfig) {
    super(new DynamoDBClient(config), {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }

  async get<T>(input: GetCommandInput): Promise<T | undefined> {
    const result = await this.send(new GetCommand(input));
    return result.Item as T | undefined;
  }

  async put<T>(input: PutCommandInput): Promise<Partial<T>> {
    const result = await this.send(new PutCommand(input));
    return result.Attributes as Partial<T>;
  }

  async update<T>(input: UpdateCommandInput): Promise<Partial<T>> {
    const result = await this.send(new UpdateCommand(input));
    return (result.Attributes ?? {}) as Partial<T>;
  }

  async query<T>(input: QueryCommandInput) {
    const { Items, Count, LastEvaluatedKey, ...rest } = await this.send(
      new QueryCommand(input),
    );
    return {
      ...rest,
      items: (Items ?? []) as T[],
      count: Count,
      lastEvaluatedKey: LastEvaluatedKey,
    };
  }

  async scan<T>(input: ScanCommandInput) {
    const { Items, Count, LastEvaluatedKey, ...rest } = await this.send(
      new ScanCommand(input),
    );
    return {
      ...rest,
      items: (Items ?? []) as T[],
      count: Count,
      lastEvaluatedKey: LastEvaluatedKey,
    };
  }

  async delete(input: DeleteCommandInput) {
    return this.send(new DeleteCommand(input));
  }
}

export class DynamoTable<T, K extends keyof T>
  implements IReadableDynamoTable<T, K>, IWritableDynamoTable<T, K>
{
  private readonly dynamoDb: DynamoDb;

  constructor(
    private readonly tableName: string,
    region: string,
  ) {
    this.dynamoDb = new DynamoDb({
      region,
    });
  }

  async get(key: { [Key in K]: T[Key] }): Promise<T | undefined> {
    return this.dynamoDb.get<T>({
      TableName: this.tableName,
      Key: key,
    });
  }

  async query(input: Omit<QueryCommandInput, 'TableName'>) {
    return this.dynamoDb.query<T>({
      ...input,
      TableName: this.tableName,
    });
  }

  async scan(input: Omit<ScanCommandInput, 'TableName'>) {
    return this.dynamoDb.scan<T>({
      ...input,
      TableName: this.tableName,
    });
  }

  async put(input: Omit<PutCommandInput, 'TableName' | 'Item'> & { Item: T }) {
    return this.dynamoDb.put<T>({
      ...input,
      Item: this.serializeRow(input.Item),
      TableName: this.tableName,
    });
  }

  async update(
    input: Omit<UpdateCommandInput, 'TableName' | 'Key'> & {
      Key: { [Key in K]: T[Key] };
    },
  ) {
    return this.dynamoDb.update<T>({
      ...input,
      TableName: this.tableName,
    });
  }

  async patch(key: { [Key in K]: T[Key] }, patch: Partial<T>): Promise<T> {
    const patchEntries = Object.entries(patch);

    if (patchEntries.length === 0) {
      const row = await this.get(key);
      if (!row) {
        throw new Error(`Not found.`);
      }
      return row;
    }

    const updateInput: Omit<UpdateCommandInput, 'TableName'> = patchEntries
      .filter(([_, value]) => value !== undefined)
      .reduce(
        (updateInput, [key, value], i) => ({
          ...updateInput,
          UpdateExpression: `${updateInput.UpdateExpression}${
            i === 0 ? 'set ' : ', '
          } #${key} = :${key}`,
          ExpressionAttributeNames: {
            ...updateInput.ExpressionAttributeNames,
            [`#${key}`]: key,
          },
          ExpressionAttributeValues: {
            ...updateInput.ExpressionAttributeValues,
            [`:${key}`]: value,
          },
        }),
        {
          Key: key,
          UpdateExpression: '',
          ExpressionAttributeNames: {},
          ExpressionAttributeValues: {},
          ReturnValues: 'ALL_NEW',
        } as Omit<UpdateCommandInput, 'TableName'>,
      );

    const result = await this.update(updateInput as any);
    return result as T;
  }

  async delete(input: Omit<DeleteCommandInput, 'TableName'>) {
    return this.dynamoDb.delete({
      ...input,
      TableName: this.tableName,
    });
  }

  serializeRow(value: T): Record<string, AttributeValue> {
    // Hope for the best by default
    return value as Record<string, AttributeValue>;
  }

  deserializeRow(value: Record<string, AttributeValue>): T {
    // Hope for the best by default
    return value as T;
  }
}

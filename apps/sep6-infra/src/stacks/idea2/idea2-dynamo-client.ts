/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from '@aws-sdk/lib-dynamodb';
import {
  AttributeValue,
  DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import { ClientRef, DynamoRef } from './idea2-types';
import { resolveLambdaRuntimeEnv } from './idea2-env';

export function getDynamoTableClient<
  T extends Extract<ClientRef, { dynamo: any }>
>(dynamoClientRef: T) {
  const dynamoRef = dynamoClientRef.dynamo.id;
  const tableConstructRef =
    resolveLambdaRuntimeEnv().IDEA_CONSTRUCT_REF_MAP.tables[dynamoRef];

  return new DynamoTable(
    tableConstructRef.tableName
  ) as T['dynamo'] extends DynamoRef<infer R, infer Q>
    ? DynamoTable<R, Q>
    : DynamoTable<any, any>;
}

export class DynamoDb extends DynamoDBDocumentClient {
  constructor(config: DynamoDBClientConfig) {
    super(new DynamoDBClient(config));
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
      new QueryCommand(input)
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
      new ScanCommand(input)
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

export class DynamoTable<T, K extends keyof T> {
  private readonly dynamoDb: DynamoDb;

  constructor(private readonly tableName: string) {
    this.dynamoDb = new DynamoDb({
      // region: TODO
    });
  }

  async get(key: { [Key in K]: T[Key] }): Promise<T | undefined> {
    return this.dynamoDb.get<T>({
      TableName: this.tableName,
      Key: key,
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
    }
  ) {
    return this.dynamoDb.update<T>({
      ...input,
      TableName: this.tableName,
    });
  }

  async patch(key: { [Key in K]: T[Key] }, patch: Partial<T>): Promise<T> {
    const patchEntries = Object.entries(patch);

    if (patchEntries.length === 0) {
      // TODO: Handle more gracefully?
      throw new Error('Empty patch.');
    }

    const updateInput: Omit<UpdateCommandInput, 'TableName'> =
      patchEntries.reduce(
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
        } as Omit<UpdateCommandInput, 'TableName'>
      );

    const result = await this.update(updateInput as any);
    return result as T;
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

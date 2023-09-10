/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Inject,
  Injectable,
  Module,
  ModuleMetadata,
  Type,
  applyDecorators,
} from '@nestjs/common';
import {
  DynamicResourceModule,
  DynamoMetadata,
  RESOURCE_METADATA,
  Resource,
  ResourceType,
  getResourceMetadata,
} from './resource-module';
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
import { AttributeValue, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const DYNAMO_METADATA = Symbol('DYNAMO_METADATA');

const DEFAULT_DYNAMO_PERMISSIONS: DynamoMetadata['permissions'] = {
  read: true,
  write: false,
};

export function DynamoModule(
  tableProvider: {
    metadata: Omit<DynamoMetadata, 'type'>;
    new (...args: any[]): DynamoTable<any, any>;
  },
  moduleMetadata: ModuleMetadata = {}
) {
  const metadata: DynamoMetadata = {
    ...tableProvider.metadata,
    permissions: {
      ...DEFAULT_DYNAMO_PERMISSIONS,
      ...tableProvider.metadata.permissions,
    },
    type: ResourceType.DYNAMO_TABLE,
  };
  return applyDecorators(
    Resource(metadata),
    Module({
      imports: [
        ...(metadata.streams?.map((stream) => stream.lambda) ?? []),
        ...(moduleMetadata.imports ?? []),
      ],
      controllers: moduleMetadata.controllers,
      providers: [
        { provide: DYNAMO_METADATA, useValue: metadata },
        DynamoDb,
        tableProvider,
        ...(moduleMetadata.providers ?? []),
      ],
      exports: [tableProvider, ...(moduleMetadata.exports ?? [])],
    })
  );
}

export function getDynamoMetadata(
  module: Type<any> | (() => void)
): DynamoMetadata | undefined {
  return getResourceMetadata(module, ResourceType.DYNAMO_TABLE);
}

export function mergeDynamoMetadata<A extends DynamoMetadata>(
  a: A,
  b: DynamoMetadata
): A {
  return {
    ...a,
    ...b,
    permissions: {
      read: (a.permissions?.read ?? false) || (b.permissions?.read ?? false),
      write: (a.permissions?.write ?? false) || (b.permissions?.write ?? false),
    },
  };
}

@Injectable()
export class DynamoDb extends DynamoDBDocumentClient {
  constructor() {
    super(new DynamoDBClient({}));
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

export class BaseDynamoModule {
  static grant(
    permissions: DynamoMetadata['permissions']
  ): DynamicResourceModule<ResourceType.DYNAMO_TABLE> {
    return {
      module: this,
      [RESOURCE_METADATA]: {
        permissions: { ...DEFAULT_DYNAMO_PERMISSIONS, ...permissions },
      },
    };
  }
}

export abstract class DynamoTable<T, K extends Partial<T>> {
  static metadata: Omit<DynamoMetadata, 'type'>;

  @Inject(DYNAMO_METADATA) public readonly metadata!: DynamoMetadata;
  @Inject(DynamoDb) public readonly dynamoDb!: DynamoDb;

  async get(key: K): Promise<T | undefined> {
    return this.dynamoDb.get<T>({
      TableName: this.metadata.id,
      Key: key,
    });
  }

  async put(input: Omit<PutCommandInput, 'TableName' | 'Item'> & { Item: T }) {
    return this.dynamoDb.put<T>({
      ...input,
      Item: this.serializeRow(input.Item),
      TableName: this.metadata.id,
    });
  }

  async update(
    input: Omit<UpdateCommandInput, 'TableName' | 'Key'> & { Key: K }
  ) {
    return this.dynamoDb.update<T>({
      ...input,
      TableName: this.metadata.id,
    });
  }

  async patch(key: K, patch: Partial<T>): Promise<T> {
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
      TableName: this.metadata.id,
    });
  }

  async scan(input: Omit<ScanCommandInput, 'TableName'>) {
    return this.dynamoDb.scan<T>({
      ...input,
      TableName: this.metadata.id,
    });
  }

  async delete(input: Omit<DeleteCommandInput, 'TableName'>) {
    return this.dynamoDb.delete({
      ...input,
      TableName: this.metadata.id,
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

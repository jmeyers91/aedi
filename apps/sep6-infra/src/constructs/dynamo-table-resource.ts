import { MergedNestResourceNode, ResourceType } from '@sep6/utils';
import { AttributeType, Table, TableProps } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface Props
  extends Omit<TableProps, 'tableName' | 'partitionKey' | 'sortKey'> {
  envName: string;
  dynamoResource: MergedNestResourceNode<ResourceType.DYNAMO_TABLE>;
}

export class DynamoTableResourceConstruct extends Table {
  constructor(
    scope: Construct,
    id: string,
    { dynamoResource, envName, ...props }: Props
  ) {
    const metadata = dynamoResource.mergedMetadata;
    super(scope, id, {
      ...props,
      tableName: `${envName}-${metadata.id}`,
      partitionKey: {
        name: metadata.partitionKey.name,
        type: AttributeType[metadata.partitionKey.type],
      },
      ...(metadata.sortKey
        ? {
            sortKey: {
              name: metadata.sortKey.name,
              type: AttributeType[metadata.sortKey.type],
            },
          }
        : {}),
    });
  }
}

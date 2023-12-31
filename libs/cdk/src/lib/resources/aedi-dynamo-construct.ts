import { Construct } from 'constructs';
import {
  DynamoConstructRef,
  DynamoRef,
  DynamoRefClientOptions,
  RefType,
  defaultDynamoRefClientOptions,
} from '@aedi/common';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ILambdaDependency } from '../aedi-infra-types';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { AediBaseConstruct } from '../aedi-base-construct';

export class AediDynamoTable
  extends AediBaseConstruct<RefType.DYNAMO>
  implements ILambdaDependency<DynamoConstructRef>
{
  public readonly table: TableV2;
  public readonly dynamoRef: DynamoRef<any, any>;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: DynamoRef<any, any> },
  ) {
    super(scope, id, props);

    const dynamoRef = (this.dynamoRef = this.resourceRef);

    this.table = new TableV2(this, 'table', {
      removalPolicy: RemovalPolicy.DESTROY, // TODO: Make this configurable
      partitionKey: {
        name: dynamoRef.partitionKey.name,
        type: AttributeType[dynamoRef.partitionKey.type],
      },
      sortKey: dynamoRef.sortKey
        ? {
            name: dynamoRef.sortKey.name as string,
            type: AttributeType[dynamoRef.sortKey.type],
          }
        : undefined,
    });
  }

  getConstructRef() {
    return {
      tableName: this.table.tableName,
      region: Stack.of(this).region,
    };
  }

  grantLambdaAccess(
    { lambdaFunction }: AediLambdaFunction,
    options?: DynamoRefClientOptions,
  ): void {
    options = { ...defaultDynamoRefClientOptions, ...options };
    if (options.fullAccess) {
      this.table.grantFullAccess(lambdaFunction);
    } else if (options.read && options.write) {
      this.table.grantReadWriteData(lambdaFunction);
    } else if (options.read) {
      this.table.grantReadData(lambdaFunction);
    } else if (options.write) {
      this.table.grantWriteData(lambdaFunction);
    }
  }
}

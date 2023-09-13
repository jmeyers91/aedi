/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import {
  DynamoConstructRef,
  DynamoRef,
  DynamoRefClientOptions,
} from '@sep6/idea2';
import { createConstructName } from './idea2-infra-utils';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ILambdaDependency } from './idea2-infra-types';
import { Idea2LambdaFunction } from './idea2-lambda-construct';

export class Idea2DynamoTable
  extends Construct
  implements ILambdaDependency<DynamoConstructRef>
{
  public readonly table: TableV2;
  public readonly dynamoRef: DynamoRef<any, any>;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: dynamoRef }: { resourceRef: DynamoRef<any, any> }
  ) {
    super(scope, id);

    this.dynamoRef = dynamoRef;

    this.table = new TableV2(this, dynamoRef.id, {
      removalPolicy: RemovalPolicy.DESTROY, // TODO: Make this configurable
      tableName: createConstructName(this, dynamoRef.id),
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
    lambda: Idea2LambdaFunction,
    options?: DynamoRefClientOptions
  ): void {
    if (options?.readonly) {
      this.table.grantReadData(lambda.lambdaFunction);
    } else {
      this.table.grantReadWriteData(lambda.lambdaFunction);
    }
  }
}

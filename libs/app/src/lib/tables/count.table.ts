import { Injectable } from '@nestjs/common';
import { TableId } from '@sep6/constants';
import {
  AttributeType,
  BaseDynamoModule,
  DynamoModule,
  DynamoTable,
} from '@sep6/utils';

export interface CountTableRow {
  counterId: string;
  count: number;
}

@Injectable()
export class CountTable extends DynamoTable<
  CountTableRow,
  { counterId: string }
> {
  static override metadata = {
    id: TableId.COUNT,
    partitionKey: {
      name: 'counterId' satisfies keyof CountTableRow,
      type: AttributeType.STRING,
    },
  };
}

@DynamoModule(CountTable)
export class CountTableModule extends BaseDynamoModule {}

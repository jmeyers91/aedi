import { Inject, Injectable } from '@nestjs/common';
import { ILambdaEventHandler } from '@sep6/utils';
import { CountTable } from '../../tables/count.table';
import { DynamoDBStreamEvent } from 'aws-lambda';

@Injectable()
export class ContactCounterService implements ILambdaEventHandler {
  constructor(@Inject(CountTable) private readonly countTable: CountTable) {}

  async handleLambdaEvent(event: DynamoDBStreamEvent) {
    try {
      const counterId = 'contacts';
      const { count } = (await this.countTable.get({ counterId })) ?? {
        count: 0,
      };
      await this.countTable.put({ Item: { counterId, count: count + 1 } });
    } catch (error) {
      console.log(`Failed to increment`, error);
    }
    console.log('Received records!', event);
  }
}

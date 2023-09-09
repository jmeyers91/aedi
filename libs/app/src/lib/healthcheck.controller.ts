import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CountTable } from './tables/count.table';
import { RequireAuth, UserId } from './utils/auth-guard';

@Controller()
export class HealthcheckController {
  constructor(@Inject(CountTable) private readonly countTable: CountTable) {}

  @Get('/')
  getIndex() {
    return 'Hello world!';
  }

  @Get('/healthcheck')
  healthcheck() {
    return 'Success!';
  }

  @RequireAuth()
  @Get('/healthcheck/user')
  currentUser(@UserId() userId: string) {
    return `The current user is: ${userId}`;
  }

  @Post('/count/:counterId')
  async count(@Param('counterId') counterId: string) {
    try {
      const counter = await this.countTable.get({ counterId });
      const count = (counter?.count ?? 0) + 1;

      await this.countTable.put({
        Item: { counterId, count },
      });

      return `Count: ${count}`;
    } catch (error) {
      console.log('error', error);
      return `Error: ${(error as Error).message}`;
    }
  }
}

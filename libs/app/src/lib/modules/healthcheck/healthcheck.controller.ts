import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CountTable } from '../../tables/count.table';

import { CognitoUserId, UseCognitoGuard } from '@sep6/utils';
import { UserPoolId } from '@sep6/constants';

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

  @Get('/healthcheck/user')
  @UseCognitoGuard(UserPoolId.APP_USER_POOL)
  currentUser(@CognitoUserId() userId: string) {
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

  @Get('/cors-domains')
  async getCorsDomains() {
    return { CORS_ORIGINS: (process.env as any).CORS_ORIGINS };
  }
}

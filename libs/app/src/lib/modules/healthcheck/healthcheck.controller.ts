import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CountTable } from '../../tables/count.table';

import { CognitoUserId, CognitoGuard, DisableCognitoGuard } from '@sep6/utils';
import { UserPoolId } from '@sep6/constants';

@Controller()
@CognitoGuard(UserPoolId.APP_USER_POOL)
export class HealthcheckController {
  constructor(@Inject(CountTable) private readonly countTable: CountTable) {}

  @Get('/')
  getIndex() {
    return 'Hello world!';
  }

  @Get('/healthcheck')
  @DisableCognitoGuard()
  healthcheck() {
    return 'Success!';
  }

  @Get('/healthcheck/user')
  currentUser(@CognitoUserId() userId: string) {
    return `The current user is: ${userId}`;
  }

  @Post('/count/:counterId')
  @DisableCognitoGuard()
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
  @DisableCognitoGuard()
  async getCorsDomains() {
    return { CORS_ORIGINS: (process.env as any).CORS_ORIGINS };
  }
}

import { Controller, Get, Param, Put } from '@nestjs/common';
import { UserPoolId } from '@sep6/constants';
import { CognitoClaim, CognitoUserId, CognitoGuard } from '@sep6/utils';

@Controller('/user')
export class UserController {
  @Get()
  @CognitoGuard(UserPoolId.APP_USER_POOL)
  async getCurrentUser(
    @CognitoClaim() claim: CognitoClaim,
    @CognitoUserId() userId: string
  ) {
    return { claim, userId };
  }

  @Put(':userId')
  async updateUser(@Param('userId') userId: string) {
    return `You can't update ${userId}`;
  }
}

import { Controller, Get, Param, Put } from '@nestjs/common';

@Controller('/user')
export class UserController {
  @Get()
  async getCurrentUser() {
    return { id: 'guest' };
  }

  @Put(':userId')
  async updateUser(@Param('userId') userId: string) {
    return `You can't update ${userId}`;
  }
}

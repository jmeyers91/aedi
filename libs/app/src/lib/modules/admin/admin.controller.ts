import { Controller, Post } from '@nestjs/common';

@Controller('/admin')
export class AdminController {
  @Post('/secret')
  async createSecret() {
    return { success: true, message: 'Secret created!' };
  }
}

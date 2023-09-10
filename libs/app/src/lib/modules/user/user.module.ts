import { DynamicModule } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { LambdaModule } from '@sep6/utils';

export * from './user.service';

@LambdaModule(
  {
    providers: [UserService],
    exports: [UserService],
  },
  {
    name: 'user-module',
  }
)
export class UserModule {
  static withControllers(): DynamicModule {
    return { module: this, controllers: [UserController] };
  }
}

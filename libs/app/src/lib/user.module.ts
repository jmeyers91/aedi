import { DbModule } from './db.module';
import { UserService } from './user.service';
import { LambdaModule } from '@sep6/utils';

export * from './user.service';

@LambdaModule({
  lambda: {
    handler: __filename,
  },
  imports: [DbModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

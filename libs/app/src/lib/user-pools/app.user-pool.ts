import { UserPoolId } from '@sep6/constants';
import { UserPoolModule } from '@sep6/utils';

@UserPoolModule({
  id: UserPoolId.APP_USER_POOL,
})
export class AppUserPoolModule {}

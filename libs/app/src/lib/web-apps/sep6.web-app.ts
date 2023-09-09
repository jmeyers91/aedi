import { DomainId, UserPoolId, WebAppId } from '@sep6/constants';
import { WebAppModule } from '@sep6/utils';

@WebAppModule({
  id: WebAppId.APP,
  domain: DomainId.APP,
  userPool: UserPoolId.APP_USER_POOL,
  distPath: 'dist/apps/sep6-app',
})
export class Sep6WebApp {}

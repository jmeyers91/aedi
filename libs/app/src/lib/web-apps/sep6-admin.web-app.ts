import { DomainId, WebAppId } from '@sep6/constants';
import { WebAppModule } from '@sep6/utils';

@WebAppModule({
  id: WebAppId.ADMIN,
  domainName: DomainId.ADMIN,
  distPath: 'dist/apps/sep6-admin',
})
export class Sep6WebAdminApp {}

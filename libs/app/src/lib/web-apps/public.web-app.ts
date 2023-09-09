import { WebAppId } from '@sep6/constants';
import { WebAppModule } from '@sep6/utils';

@WebAppModule({
  id: WebAppId.APP,
  distPath: 'dist/apps/sep6-app',
})
export class PublicWebApp {}

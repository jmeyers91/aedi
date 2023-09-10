import { LambdaModule, LambdaType } from '@sep6/utils';
import { ContactCounterService } from './contact-counter.service';
import { CountTableModule } from '../../tables/count.table';

@LambdaModule(
  {
    imports: [CountTableModule.grant({ write: true })],
  },
  {
    name: 'contact-counter-module',
    lambdaType: LambdaType.STANDARD,
    handlerService: ContactCounterService,
  }
)
export class ContactCounterModule {}

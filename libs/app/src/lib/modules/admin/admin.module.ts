import { DynamicModule } from '@nestjs/common';
import { LambdaModule } from '@sep6/utils';
import { ContactModule } from '../contact/contact.module';
import { AdminController } from './admin.controller';
import { DomainId } from '@sep6/constants';

@LambdaModule(
  {
    imports: [ContactModule],
  },
  { allowCorsDomains: [DomainId.ADMIN] }
)
export class AdminModule {
  static withControllers(): DynamicModule {
    return {
      module: this,
      controllers: [AdminController],
    };
  }
}

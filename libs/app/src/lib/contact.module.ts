import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { LambdaModule } from '@sep6/utils';
import { UserModule } from './user.module';
import { DynamicModule } from '@nestjs/common';
import { ContactTableModule } from './resources/contact-table.module';

export * from './contact.service';

@LambdaModule({
  imports: [UserModule, ContactTableModule.grant({ read: true, write: true })],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {
  static withControllers(): DynamicModule {
    return { module: this, controllers: [ContactController] };
  }
}

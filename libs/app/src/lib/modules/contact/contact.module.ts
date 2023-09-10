import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { LambdaModule } from '@sep6/utils';
import { UserModule } from '../user/user.module';
import { DynamicModule } from '@nestjs/common';
import { ContactTableModule } from '../../tables/contact.table';
import { ContactImageBucketModule } from '../../buckets/contact-image/contact-image-bucket.module';

export * from './contact.service';

@LambdaModule(
  {
    imports: [
      UserModule,
      ContactTableModule.grant({ read: true, write: true }),
      ContactImageBucketModule.grant({
        read: true,
        write: true,
        put: true,
        delete: true,
      }),
    ],
    providers: [ContactService],
    exports: [ContactService],
  },
  {
    name: 'contact-module',
  }
)
export class ContactModule {
  static withControllers(): DynamicModule {
    return { module: this, controllers: [ContactController] };
  }
}

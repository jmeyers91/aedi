import { DbModule } from './db.module';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { LambdaModule } from '@sep6/utils';
import { ContactPhotoBucketModule } from './contact-photo-bucket.module';

export * from './contact.service';

@LambdaModule({
  imports: [DbModule, ContactPhotoBucketModule],
  providers: [ContactService],
  controllers: [ContactController],
  exports: [ContactService],
})
export class ContactModule {}

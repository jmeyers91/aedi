import { BaseBucketModule, BucketModule } from '@sep6/utils';
import { ContactImageBucket } from './contact-image.bucket';

@BucketModule(ContactImageBucket)
export class ContactImageBucketModule extends BaseBucketModule {}

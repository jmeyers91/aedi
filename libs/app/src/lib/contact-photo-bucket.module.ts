import { Injectable } from '@nestjs/common';
import { BucketId } from '@sep6/constants';
import {
  Bucket,
  BucketMetadata,
  BucketModule,
  ResourceType,
} from '@sep6/utils';

const bucketMetadata: BucketMetadata = {
  type: ResourceType.S3_BUCKET,
  bucketId: BucketId.CONTACT_PHOTO_BUCKET,
};

@Injectable()
export class ContactPhotoBucket extends Bucket {
  constructor() {
    super(bucketMetadata);
  }
}

@BucketModule({
  ...bucketMetadata,
  providers: [ContactPhotoBucket],
  exports: [ContactPhotoBucket],
})
export class ContactPhotoBucketModule {}

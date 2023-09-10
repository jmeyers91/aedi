import { Injectable } from '@nestjs/common';
import { BucketId } from '@sep6/constants';
import { BucketMetadata, BucketService } from '@sep6/utils';

@Injectable()
export class ContactImageBucket extends BucketService {
  static override readonly metadata: Omit<BucketMetadata, 'type'> = {
    id: BucketId.CONTACT_IMAGE_BUCKET,
    permissions: { read: true, write: true }, // TODO: Fix these
  };
}

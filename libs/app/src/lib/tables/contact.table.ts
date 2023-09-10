import { TableId } from '@sep6/constants';
import {
  AttributeType,
  BaseDynamoModule,
  DynamoMetadata,
  DynamoModule,
  DynamoTable,
} from '@sep6/utils';
import { ContactCounterModule } from '../modules/contact-counter/contact-counter.module';

export interface ContactTableKey {
  contactId: string;
  userId: string;
}

export interface ContactTableRow extends ContactTableKey {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export class ContactTable extends DynamoTable<
  ContactTableRow,
  ContactTableKey
> {
  static override metadata: Omit<DynamoMetadata, 'type'> = {
    id: TableId.CONTACT,
    partitionKey: {
      name: 'userId' satisfies keyof ContactTableKey,
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'contactId' satisfies keyof ContactTableKey,
      type: AttributeType.STRING,
    },
    streams: [
      {
        lambda: ContactCounterModule,
        startingPosition: 'LATEST',
        batchSize: 1,
        filterPatterns: [{ eventName: ['INSERT'] }],
      },
    ],
  };
}

@DynamoModule(ContactTable)
export class ContactTableModule extends BaseDynamoModule {}

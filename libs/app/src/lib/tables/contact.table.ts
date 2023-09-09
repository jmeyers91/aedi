import { TableId } from '@sep6/constants';
import {
  AttributeType,
  BaseDynamoModule,
  DynamoModule,
  DynamoTable,
} from '@sep6/utils';

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
  static override metadata = {
    id: TableId.CONTACT,
    partitionKey: {
      name: 'userId' satisfies keyof ContactTableKey,
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'contactId' satisfies keyof ContactTableKey,
      type: AttributeType.STRING,
    },
  };
}

@DynamoModule(ContactTable)
export class ContactTableModule extends BaseDynamoModule {}

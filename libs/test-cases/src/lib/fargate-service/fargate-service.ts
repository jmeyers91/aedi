import { FargateService, Table, TableClient } from '@aedi/common';
import { Scope } from '../app';
import { Contact } from './types';

const scope = Scope('fargate-service');

const contactsTableResource = Table<Contact, 'userId' | 'contactId'>(
  scope,
  'contacts-table',
  {
    partitionKey: {
      name: 'userId',
      type: 'STRING',
    },
    sortKey: {
      name: 'contactId',
      type: 'STRING',
    },
  },
);

export const api = FargateService(
  scope,
  'api',
  {
    contactsTable: TableClient(contactsTableResource),
  },
  ({ contactsTable }) => {
    setInterval(() => {
      console.log(`Service is running...`);
    }, 1000);
  },
);

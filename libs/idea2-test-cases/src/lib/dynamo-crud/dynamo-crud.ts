import {
  RouteEvent,
  Get,
  Post,
  Put,
  Delete,
  grant,
  RestApi,
  Table,
  TableClient,
  reply,
} from '@aedi/idea2';
import { Scope } from '../idea';
import { randomUUID } from 'crypto';

const scope = Scope('dynamo-crud');

export const api = RestApi(scope, 'api');

interface Contact {
  userId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

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

const contactsTable = TableClient(contactsTableResource);
const writableContactsTable = TableClient(
  grant(contactsTableResource, { write: true }),
);

export const listContacts = Get(
  api,
  'listContacts',
  '/contacts',
  { contactsTable },
  async ({ contactsTable }, event) => {
    const { userId } = assertAuth(event);

    return await contactsTable.query({
      KeyConditionExpression: `userId = :userId`,
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
  },
);

export const getContact = Get(
  api,
  'getContact',
  '/contacts/{contactId}',
  { contactsTable },
  async ({ contactsTable }, event) => {
    const { userId } = assertAuth(event);
    const { contactId } = event.pathParameters;

    const contact = await contactsTable.get({ userId, contactId });

    if (!contact) {
      throw badRequest('Not found', 404);
    }

    return contact;
  },
);

export const createContact = Post(
  api,
  'createContact',
  '/contacts',
  { contactsTable: writableContactsTable },
  async ({ contactsTable }, event) => {
    const { userId } = assertAuth(event);
    const contactId = randomUUID();
    const {
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
    } = JSON.parse(event.body ?? '{}');

    const contact = {
      userId,
      contactId,
      firstName,
      lastName,
      email,
      phone,
    };

    await contactsTable.put({ Item: contact });

    return contact;
  },
);

export const updateContact = Put(
  api,
  'updateContact',
  '/contacts/{contactId}',
  { contactsTable: writableContactsTable },
  async ({ contactsTable }, event) => {
    const { userId } = assertAuth(event);
    const { contactId } = event.pathParameters;
    const { firstName, lastName, email, phone } = JSON.parse(
      event.body ?? '{}',
    );

    const updatedContact = await contactsTable.patch(
      { userId, contactId },
      { firstName, lastName, email, phone },
    );

    return updatedContact;
  },
);

export const deleteContact = Delete(
  api,
  'deleteContact',
  '/contacts/{contactId}',
  { contactsTable: writableContactsTable },
  async ({ contactsTable }, event) => {
    const { userId } = assertAuth(event);
    const { contactId } = event.pathParameters;

    await contactsTable.delete({ Key: { userId, contactId } });

    return { success: true };
  },
);

export const exportContacts = Get(
  api,
  'exportContacts',
  '/contacts.csv',
  { contactsTable },
  async ({ contactsTable }, event) => {
    const { userId } = assertAuth(event);

    const { items: contacts = [] } = await contactsTable.query({
      KeyConditionExpression: `userId = :userId`,
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const keys: (keyof Contact)[] = ['firstName', 'lastName', 'email', 'phone'];
    const csv = [
      keys,
      ...contacts.map((contact) => keys.map((key) => contact[key])),
    ]
      .map((row) => row.join(', '))
      .join('\n');

    return reply(csv, 200, {
      'Content-Type': 'text/csv',
    });
  },
);

// Used to test responding with strings as HTML
export const getHtml = Get(api, 'getHtml', '/html', {}, async () => {
  return 'This text is assumed to be HTML and is returned as-is';
});

// Used to test responding with objects as JSON
export const getJSON = Get(api, 'getJSON', '/json', {}, async () => {
  return {
    message:
      'This object is assumed to be JSON and is stringified before being returned',
  };
});

// Used to test custom responses
export const getTeapot = Get(api, 'getTeapot', '/teapot', {}, async () => {
  return reply("I'm a teapot", 418, {
    'Content-Type': 'piping-hot/tea',
  });
});

function assertAuth(event: RouteEvent): { userId: string } {
  const userId = event.headers.Authorization;
  if (!userId) {
    throw badRequest('Unauthorized', 401);
  }
  return { userId };
}

function badRequest(
  message: string,
  statusCode = 400,
): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

import {
  Delete,
  Get,
  Lambda,
  Post,
  Put,
  RestApi,
  RouteEvent,
  StaticSite,
  Table,
  TableClient,
  UserPool,
  grant,
  reply,
} from '@sep6/idea2';
import { Scope } from '../idea';
import { randomUUID } from 'crypto';
import { PreSignUpTriggerEvent } from 'aws-lambda';

const scope = Scope('static-site');

export const api = RestApi(scope, 'api');

// Auto-confirm users to avoid dealing with email/sms codes in tests
export const preSignUpTrigger = Lambda(
  scope,
  'preSignUpTrigger',
  {},
  (_, event: PreSignUpTriggerEvent) => {
    event.response.autoConfirmUser = true;
    return event;
  }
);

export const userPool = UserPool(scope, 'user-pool', {
  domainPrefix: 'idea2-static-site-e2e',
  selfSignUpEnabled: true,
  triggers: {
    preSignUp: preSignUpTrigger,
  },
});
export interface Contact {
  userId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const staticSite = StaticSite(scope, 'site', {
  assetPath: './dist/apps/idea2-static-site-test-app',
  clientConfig: {
    api,
    userPool,
    title: 'client config title',
  },
});

export const contactsTableResource = Table<Contact, 'userId' | 'contactId'>(
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
  }
);

const contactsTable = TableClient(contactsTableResource);
const writableContactsTable = TableClient(
  grant(contactsTableResource, { write: true })
);

export const healthcheck = Get(api, 'healthcheck', '/healthcheck', {}, () => ({
  healthy: true,
}));

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
  }
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
  }
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
  }
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
      event.body ?? '{}'
    );

    const updatedContact = await contactsTable.patch(
      { userId, contactId },
      { firstName, lastName, email, phone }
    );

    return updatedContact;
  }
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
  }
);

export const exportContacts = Get(
  api,
  'exportContacts',
  '/contacts.csv',
  { contactsTable },
  async ({ contactsTable }, event) => {
    const { userId } = assertAuth(event);

    const { Items: contacts = [] } = await contactsTable.query({
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
  }
);

function assertAuth(event: RouteEvent): { userId: string } {
  const userId = event.headers.Authorization;
  if (!userId) {
    throw badRequest('Unauthorized', 401);
  }
  return { userId };
}

function badRequest(
  message: string,
  statusCode = 400
): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

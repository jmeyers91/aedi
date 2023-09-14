import {
  RouteEvent,
  getDynamoTableClient,
  restApi,
  table,
  Get,
  Post,
  Put,
  Delete,
} from '@sep6/idea2';
import { createScope } from '../../idea';
import { randomUUID } from 'crypto';

const scope = createScope('dynamo-crud');

export const api = restApi(scope, 'api');

const contactsTable = table<
  {
    userId: string;
    contactId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  },
  'userId' | 'contactId'
>(scope, 'contacts-table', {
  partitionKey: {
    name: 'userId',
    type: 'STRING',
  },
  sortKey: {
    name: 'contactId',
    type: 'STRING',
  },
});

export const listContacts = Get(
  api,
  'listContacts',
  '/contacts',
  { contactsTable },
  async (ctx, event) => {
    const { userId } = assertAuth(event);

    const table = getDynamoTableClient(ctx.contactsTable);
    return await table.query({
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
  async (ctx, event) => {
    const { userId } = assertAuth(event);

    const { contactId } = event.pathParameters;
    const contactsTable = getDynamoTableClient(ctx.contactsTable);

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
  { contactsTable },
  async (ctx, event) => {
    const { userId } = assertAuth(event);

    const contactId = randomUUID();
    const contactsTable = getDynamoTableClient(ctx.contactsTable);
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
  { contactsTable },
  async (ctx, event) => {
    const { userId } = assertAuth(event);

    const contactsTable = getDynamoTableClient(ctx.contactsTable);
    const { contactId } = event.pathParameters;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { firstName, lastName, email, phone } = event.body as any;

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
  {},
  (_, event) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId } = assertAuth(event);

    return { TODO: true };
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

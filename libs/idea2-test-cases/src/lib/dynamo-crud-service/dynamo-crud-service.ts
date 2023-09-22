import {
  RouteEvent,
  TableClient,
  Get,
  Post,
  Put,
  Delete,
  grant,
  RestApi,
  Table,
  Scope as Idea2Scope,
  Construct,
  lambdaProxyHandler,
} from '@aedi/idea2';
import { Scope } from '../idea';
import { randomUUID } from 'crypto';

const outerScope = Scope('dynamo-crud-service');

export const service1 = ContactService(outerScope, 'service1', {
  serviceName: 'Contact service 1',
});
export const service2 = ContactService(outerScope, 'service2', {
  serviceName: 'Contact service 2',
});

export interface Contact {
  userId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

function ContactService(
  parentScope: Idea2Scope,
  id: string,
  { serviceName }: { serviceName: string },
) {
  const scope = Construct(parentScope, id);
  const api = RestApi(scope, 'api');
  const contactsTable = Table<Contact, 'userId' | 'contactId'>(
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

  const readableContactsTable = TableClient(
    grant(contactsTable, { read: true }),
  );
  const writableContactsTable = TableClient(
    grant(contactsTable, { write: true }),
  );

  const handler = lambdaProxyHandler(id, [
    Get(api, 'getServiceName', '/service-name', { contactsTable }, async () => {
      return { serviceName };
    }),

    Get(
      api,
      'listContacts',
      '/contacts',
      { contactsTable: readableContactsTable },
      async ({ contactsTable }, event) => {
        const { userId } = assertAuth(event);

        return await contactsTable.query({
          KeyConditionExpression: `userId = :userId`,
          ExpressionAttributeValues: {
            ':userId': userId,
          },
        });
      },
    ),

    Get(
      api,
      'getContact',
      '/contacts/{contactId}',
      { contactsTable: readableContactsTable },
      async ({ contactsTable }, event) => {
        const { userId } = assertAuth(event);
        const { contactId } = event.pathParameters;

        const contact = await contactsTable.get({ userId, contactId });

        if (!contact) {
          throw badRequest('Not found', 404);
        }

        return contact;
      },
    ),

    Post(
      api,
      'createContact',
      '/contacts',
      {
        contactsTable: writableContactsTable,
      },
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
    ),

    Put(
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
    ),

    Delete(
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
    ),
  ]);

  return { ...handler, api, contactsTable };
}

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

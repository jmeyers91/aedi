import {
  Body,
  Bucket,
  Lambda,
  Params,
  StaticSite,
  Table,
  TableClient,
  UserPool,
  Authorize,
  generateApiClient,
  Grant,
  reply,
  Get,
  Post,
  Put,
  Delete,
  Api,
} from '@aedi/common';
import { Scope } from '../app';
import { randomUUID } from 'crypto';
import { PreSignUpTriggerEvent } from 'aws-lambda';
import { Type } from '@sinclair/typebox';

const scope = Scope('static-site');

const resourceScope = Scope('static-site-resources');

const exampleBucket = Bucket(resourceScope, 'example-bucket');

// Auto-confirm users to avoid dealing with email/sms codes in tests
export const preSignUpTrigger = Lambda(
  scope,
  'preSignUpTrigger',
  {},
  (_, event: PreSignUpTriggerEvent) => {
    event.response.autoConfirmUser = true;
    return event;
  },
);

export const userPool = UserPool(scope, 'user-pool', {
  domainPrefix: 'aedi-static-site-e2e',
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
  },
);

const contactsTable = TableClient(contactsTableResource);
const writableContactsTable = TableClient(
  Grant(contactsTableResource, { write: true }),
);

export const api = Api(scope, 'api', {
  healthcheck: Get('/healthcheck', {}, (event, context) => ({
    healthy: true,
    cool: 'beans oh yeah',
    event,
    context,
  })),

  healthcheckWithParam: Get(
    '/healthcheck/{param}',
    {},
    (_, event, context) => ({
      healthy: true,
      cool: `beans oh yeah: ${event.pathParameters.param}`,
      event,
      context,
    }),
  ),

  listContacts: Get(
    '/contacts',
    {
      auth: Authorize(userPool),
      params: Params(
        Type.Object({
          page: Type.Optional(Type.String({ default: '0' })),
        }),
      ),
      contactsTable,
    },
    async ({ auth: { userId }, contactsTable, params: { page } }) => {
      // TODO: Add pagination
      return await contactsTable.query({
        KeyConditionExpression: `userId = :userId`,
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });
    },
  ),

  getContact: Get(
    '/contacts/{contactId}',
    { auth: Authorize(userPool), contactsTable },
    async ({ auth: { userId }, contactsTable }, event) => {
      const { contactId } = event.pathParameters;

      const contact = await contactsTable.get({ userId, contactId });

      if (!contact) {
        throw badRequest('Not found', 404);
      }

      return contact;
    },
  ),

  createContact: Post(
    '/contacts',
    {
      auth: Authorize(userPool),
      contactsTable: writableContactsTable,
      body: Body(
        Type.Object({
          firstName: Type.String(),
          lastName: Type.String(),
          email: Type.String(),
          phone: Type.String(),
        }),
      ),
    },
    async ({
      auth: { userId },
      contactsTable,
      body: { firstName, lastName, email, phone },
    }) => {
      const contactId = randomUUID();

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

  updateContact: Put(
    '/contacts/{contactId}',
    { auth: Authorize(userPool), contactsTable: writableContactsTable },
    async ({ auth: { userId }, contactsTable }, event) => {
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

  deleteContact: Delete(
    '/contacts/{contactId}',
    { auth: Authorize(userPool), contactsTable: writableContactsTable },
    async ({ auth: { userId }, contactsTable }, event) => {
      const { contactId } = event.pathParameters;

      await contactsTable.delete({ Key: { userId, contactId } });

      return { success: true };
    },
  ),

  doThing: Get(
    '/do-thing',
    {
      params: Params(
        Type.Object({
          foo: Type.String(),
          bar: Type.Optional(Type.String()),
          open: Type.Optional(
            Type.Union([Type.Literal('OPEN'), Type.Literal('CLOSED')]),
          ),
        }),
      ),
    },
    ({ params }) => ({ params }),
  ),

  exportContacts: Get(
    '/contacts.csv',
    { auth: Authorize(userPool), contactsTable },
    async ({ auth: { userId }, contactsTable }, event) => {
      const { Items: contacts = [] } = await contactsTable.query({
        KeyConditionExpression: `userId = :userId`,
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });

      const keys: (keyof Contact)[] = [
        'firstName',
        'lastName',
        'email',
        'phone',
      ];
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
  ),
});

export const staticSite = StaticSite(scope, 'site', {
  assetPath: './dist/apps/test-app',
  clientConfig: {
    api,
    apiClient: generateApiClient(api),
    userPool,
    exampleBucket,
    title: 'client config title',
  },
});

function badRequest(
  message: string,
  statusCode = 400,
): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

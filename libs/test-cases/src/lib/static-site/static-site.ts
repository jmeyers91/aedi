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
  ShareTypes,
} from '@aedi/common';
import { Scope } from '../app';
import { randomUUID } from 'crypto';
import { PreSignUpTriggerEvent } from 'aws-lambda';
import { Static, Type } from '@sinclair/typebox';

const scope = Scope('static-site');

const resourceScope = Scope('static-site-resources');

const exampleBucket = Bucket(resourceScope, 'example-bucket');

const Contact = Type.Object({
  userId: Type.String(),
  contactId: Type.String(),
  firstName: Type.String({
    minLength: 1,
    errorMessage: { minLength: 'First name is required.' },
  }),
  lastName: Type.String(),
  email: Type.String({
    format: 'email',
    errorMessage: { format: 'Must be a valid email address.' },
  }),
  phone: Type.String(),
});
const CreateContactFields = Type.Omit(Contact, ['userId', 'contactId']);
const UpdateContactFields = Type.Partial(
  Type.Omit(Contact, ['userId', 'contactId']),
);

export type Contact = Static<typeof Contact>;

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
    event,
    context,
  })),

  healthcheckWithParam: Get(
    '/healthcheck/{param}',
    {},
    (_, event, context) => ({
      healthy: true,
      param: event.pathParameters.param,
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
          page: Type.Optional(Type.String({ default: '1' })),
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
      body: Body(CreateContactFields),
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
    {
      auth: Authorize(userPool),
      body: Body(UpdateContactFields),
      contactsTable: writableContactsTable,
    },
    async (
      {
        auth: { userId },
        body: { firstName, lastName, email, phone },
        contactsTable,
      },
      event,
    ) => {
      const { contactId } = event.pathParameters;

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

  /**
   * This endpoint only exists to test param type checking.
   */
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

  /**
   * This endpoint exists to test using `reply` to override the response content type.
   */
  exportContacts: Get(
    '/contacts.csv',
    { auth: Authorize(userPool), contactsTable },
    async ({ auth: { userId }, contactsTable }, event) => {
      const { items: contacts = [] } = await contactsTable.query({
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
    types: ShareTypes<{
      Contact: Contact;
    }>(),
  },
});

function badRequest(
  message: string,
  statusCode = 400,
): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

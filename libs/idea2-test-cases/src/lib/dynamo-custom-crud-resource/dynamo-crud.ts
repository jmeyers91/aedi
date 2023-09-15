// import {
//   RouteEvent,
//   getDynamoTableClient,
//   Get,
//   Post,
//   Put,
//   Delete,
//   grant,
//   RestApi,
//   Table,
//   Scope as Idea2Scope,
//   Construct,
// } from '@sep6/idea2';
// import { Scope } from '../idea';
// import { randomUUID } from 'crypto';

// function ContactService(parentScope: Idea2Scope, id: string) {
//   const scope = Construct(parentScope, id);
//   const api = RestApi(scope, 'api');
//   const table = Table<
//     {
//       userId: string;
//       contactId: string;
//       firstName: string;
//       lastName: string;
//       email: string;
//       phone: string;
//     },
//     'userId' | 'contactId'
//   >(scope, 'contacts-table', {
//     partitionKey: {
//       name: 'userId',
//       type: 'STRING',
//     },
//     sortKey: {
//       name: 'contactId',
//       type: 'STRING',
//     },
//   });

//   const listContacts = Get(
//     api,
//     'listContacts',
//     '/contacts',
//     { contactsTable },
//     async (ctx, event) => {
//       const { userId } = assertAuth(event);
//       const table = getDynamoTableClient(ctx.contactsTable);

//       return await table.query({
//         KeyConditionExpression: `userId = :userId`,
//         ExpressionAttributeValues: {
//           ':userId': userId,
//         },
//       });
//     }
//   );

//   const getContact = Get(
//     api,
//     'getContact',
//     '/contacts/{contactId}',
//     { contactsTable },
//     async (ctx, event) => {
//       const { userId } = assertAuth(event);
//       const { contactId } = event.pathParameters;
//       const contactsTable = getDynamoTableClient(ctx.contactsTable);

//       const contact = await contactsTable.get({ userId, contactId });

//       if (!contact) {
//         throw badRequest('Not found', 404);
//       }

//       return contact;
//     }
//   );

//   const createContact = Post(
//     api,
//     'createContact',
//     '/contacts',
//     {
//       contactsTable: grant(contactsTable, {
//         write: true,
//       }),
//     },
//     async (ctx, event) => {
//       const { userId } = assertAuth(event);
//       const contactId = randomUUID();
//       const contactsTable = getDynamoTableClient(ctx.contactsTable);
//       const {
//         firstName = '',
//         lastName = '',
//         email = '',
//         phone = '',
//       } = JSON.parse(event.body ?? '{}');

//       const contact = {
//         userId,
//         contactId,
//         firstName,
//         lastName,
//         email,
//         phone,
//       };

//       await contactsTable.put({ Item: contact });

//       return contact;
//     }
//   );

//   const updateContact = Put(
//     api,
//     'updateContact',
//     '/contacts/{contactId}',
//     { contactsTable: grant(contactsTable, { write: true }) },
//     async (ctx, event) => {
//       const { userId } = assertAuth(event);
//       const { contactId } = event.pathParameters;
//       const contactsTable = getDynamoTableClient(ctx.contactsTable);
//       const { firstName, lastName, email, phone } = JSON.parse(
//         event.body ?? '{}'
//       );

//       const updatedContact = await contactsTable.patch(
//         { userId, contactId },
//         { firstName, lastName, email, phone }
//       );

//       return updatedContact;
//     }
//   );

//   const deleteContact = Delete(
//     api,
//     'deleteContact',
//     '/contacts/{contactId}',
//     { contactsTable: grant(contactsTable, { write: true }) },
//     async (ctx, event) => {
//       const { userId } = assertAuth(event);
//       const { contactId } = event.pathParameters;
//       const contactsTable = getDynamoTableClient(ctx.contactsTable);

//       await contactsTable.delete({ Key: { userId, contactId } });

//       return { success: true };
//     }
//   );

//   return api;
// }

// function assertAuth(event: RouteEvent): { userId: string } {
//   const userId = event.headers.Authorization;
//   if (!userId) {
//     throw badRequest('Unauthorized', 401);
//   }
//   return { userId };
// }

// function badRequest(
//   message: string,
//   statusCode = 400
// ): Error & { statusCode: number } {
//   return Object.assign(new Error(message), { statusCode });
// }

export const TODO = true;

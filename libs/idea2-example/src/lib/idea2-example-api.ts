/* eslint-disable @typescript-eslint/no-unused-vars */
import { ListObjectsCommand } from '@aws-sdk/client-s3';
import {
  getBucketClient,
  lambda,
  RouteEvent,
  addRoute,
  reply,
  getDynamoTableClient,
  RouteResponse,
} from '@sep6/idea2';
import { idea } from './idea2-example-app';
import { webAppBucket, api, contactsTable } from './idea2-example-resources';
import { randomUUID } from 'crypto';

export const healthcheck = addRoute(
  api,
  'GET',
  '/healthcheck',
  lambda(
    idea,
    'healthcheck',
    { bucket: webAppBucket },

    async ({ bucket }, _: RouteEvent) => {
      const { bucketName, s3Client } = getBucketClient(bucket);

      const files = await s3Client.send(
        new ListObjectsCommand({
          Bucket: bucketName,
        })
      );

      return reply({ healthy: true, files });
    }
  )
);

export const getContacts = addRoute(
  api,
  'GET',
  '/contacts',
  lambda(
    idea,
    'getContacts',
    { contactsTable },

    async (ctx, _: RouteEvent) => {
      const contactsTable = getDynamoTableClient(ctx.contactsTable);
      const userId = 'jim'; // TODO: Add cognito authorizer

      const contacts = await contactsTable.query({
        KeyConditionExpression: `userId = :userId`,
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });

      return reply({ contacts: contacts.items });
    }
  )
);

export const createContact = addRoute(
  api,
  'POST',
  '/contacts',
  lambda(
    idea,
    'createContact',
    { contactsTable },

    async (ctx, event: RouteEvent) => {
      const contactsTable = getDynamoTableClient(ctx.contactsTable);
      const userId = 'jim'; // TODO: Add cognito authorizer

      const contact = {
        ...JSON.parse(event.body as string),
        contactId: randomUUID(),
        userId,
      };

      await contactsTable.put({
        Item: contact,
        ReturnValues: 'ALL_OLD',
      });

      return reply({ contact });
    }
  )
);

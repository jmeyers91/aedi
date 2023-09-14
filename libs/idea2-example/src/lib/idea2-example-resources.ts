import { bucket, table, userPool, staticSite, secret } from '@sep6/idea2';
import { idea } from './idea2-example-app';

export const webAppBucket = bucket(idea, 'web-app-bucket', {
  assetPath: './dist/apps/sep6-app',
});

export const webAppSite = staticSite(idea, 'web-app', {
  bucket: webAppBucket,
});

export const counterTable = table<
  { counterId: string; count: number },
  'counterId'
>(idea, 'counter-table', {
  partitionKey: {
    name: 'counterId',
    type: 'STRING',
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

export const contactsTable = table<Contact, 'userId'>(idea, 'contact-table', {
  partitionKey: {
    name: 'userId',
    type: 'STRING',
  },
  sortKey: {
    name: 'contactId',
    type: 'STRING',
  },
});

export const appUserPool = userPool(idea, 'user-pool', {
  selfSignUpEnabled: true,
  domainPrefix: 'idea2-dev',
});

export const exampleSecret = secret(idea, 'example-secret', {
  arn: 'arn:aws:secretsmanager:us-west-2:664290008299:secret:idea2-example-secret-JTkxFp',
});

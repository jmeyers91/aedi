import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { getModuleClient } from '../module-client';
import { useQuery } from '@tanstack/react-query';
import { Dynamo, getS3Client } from './aws-utils';
import { GetObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import { getClientConfig } from '@sep6/client-config';
import { TableId } from '@sep6/constants';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export function App() {
  const { route } = useAuthenticator((context) => [context.route]);
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const contactCountQuery = useQuery(
    ['contact-count'],
    async () =>
      (await getModuleClient('HealthcheckModule').get('/count/contacts')).data
  );
  const isAuthenticated = route === 'authenticated';

  return (
    <div>
      <div>
        <button
          onClick={async () => {
            const response = await getModuleClient('HealthcheckModule').get(
              '/healthcheck'
            );
            console.log('Healthcheck success', response.data);
          }}
        >
          Healthcheck
        </button>
        <button
          onClick={async () => {
            const response = await getModuleClient('ContactModule').get(
              '/contacts'
            );
            console.log('Contact list', response.data);
          }}
        >
          List contacts
        </button>
        <button
          onClick={async () => {
            const response = await getModuleClient('ContactModule').post(
              '/contacts',
              {
                firstName: 'joe',
                lastName: 'schmoe',
                email: 'joe.schmoe@example.com',
                phone: '+15551231234',
              }
            );
            console.log('Contact created', response.data);
          }}
        >
          Create contact
        </button>
        <button
          onClick={async () => {
            const { dynamo, identityId } = await Dynamo.getTableClient(
              TableId.CONTACT
            );
            const response = await dynamo.send(
              new PutCommand({
                TableName: dynamo.tableName,
                ReturnValues: 'ALL_OLD',
                Item: {
                  userId: identityId,
                  contactId: crypto.randomUUID(),
                  firstName: 'joe',
                  lastName: 'schmoe',
                  email: 'joe.schmoe@example.com',
                  phone: '+15551231234',
                },
              })
            );
            console.log('success - created contact', response);
            // TODO: Attempt to query contacts
            // const contacts = await dynamo.send(new QueryCommand({

            // }))
          }}
        >
          Create contact (direct)
        </button>
        <button
          onClick={async () => {
            const { dynamo } = await Dynamo.getTableClient(TableId.CONTACT);
            const response = await dynamo
              .send(
                new PutCommand({
                  TableName: dynamo.tableName,
                  ReturnValues: 'ALL_OLD',
                  Item: {
                    userId: 'cool beans',
                    contactId: crypto.randomUUID(),
                    firstName: 'joe',
                    lastName: 'schmoe',
                    email: 'joe.schmoe@example.com',
                    phone: '+15551231234',
                  },
                })
              )
              .catch((error) => {
                console.log(`Success - expected error`, error);
                return null;
              });

            if (response) {
              console.log('oh no we got around the security policy', response);
              throw new Error(`This request should have failed`);
            }
          }}
        >
          Create contact (incorrect user id)
        </button>
        <button
          onClick={async () => {
            const response = await getModuleClient('UserModule').get('/user', {
              headers: {
                Authorization: 'jim',
              },
            });
            console.log('User', response.data);
          }}
        >
          Get current user
        </button>
        <button
          onClick={async () => {
            const response = await getModuleClient('HealthcheckModule').get(
              '/cors-domains'
            );
            console.log('CORS domains', response.data);
          }}
        >
          Get CORS urls
        </button>
        <button
          onClick={async () => {
            const response = await getModuleClient('AdminModule').post(
              '/admin/secret'
            );
            console.log('Admin secret', response.data);
          }}
        >
          Call admin API
        </button>
        <button
          onClick={async () => {
            const response = await getModuleClient('HealthcheckModule').post(
              '/count/coolbeans'
            );
            console.log('Count', response.data);
          }}
        >
          Count
        </button>
        {!!user && (
          <button
            onClick={async () => {
              const bucketConfig =
                getClientConfig().buckets['contact-image-bucket'];
              if (!bucketConfig) {
                throw new Error(`No bucket name: ${bucketConfig}`);
              }
              const { bucketName, region } = bucketConfig;

              try {
                const { s3Client, identityId } = await getS3Client(region);
                const prefix = `private/${identityId}`;
                console.log(`Listing ${prefix} in ${bucketName}`);
                const listResponse = await s3Client.send(
                  new ListObjectsCommand({
                    Bucket: bucketName,
                    Prefix: prefix,
                  })
                );
                console.log('List success', listResponse);
              } catch (error) {
                console.log(`Failed to list`, error);
              }

              try {
                const { s3Client, identityId } = await getS3Client(region);
                const key = `private/${identityId}/foo`;
                console.log(`Getting ${key} in ${bucketName}`);
                const listResponse = await s3Client.send(
                  new GetObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                  })
                );
                console.log('Get success', listResponse);
              } catch (error) {
                console.log(`Failed to get`, error);
              }
            }}
          >
            List bucket objects
          </button>
        )}
      </div>
      {isAuthenticated ? (
        <>
          <h1>Welcome {user.attributes?.email}</h1>
          <button onClick={() => signOut()}>Sign-out</button>
        </>
      ) : (
        <Authenticator />
      )}
      <h2>{contactCountQuery.data ?? null}</h2>
    </div>
  );
}

export default App;

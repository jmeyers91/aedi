import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { getModuleClient } from '../module-client';

export function App() {
  const { route } = useAuthenticator((context) => [context.route]);
  const { user, signOut } = useAuthenticator((context) => [context.user]);
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
      </div>
      {isAuthenticated ? (
        <>
          <h1>Welcome {user.attributes?.email}</h1>
          <button onClick={() => signOut()}>Sign-out</button>
        </>
      ) : (
        <Authenticator />
      )}
    </div>
  );
}

export default App;

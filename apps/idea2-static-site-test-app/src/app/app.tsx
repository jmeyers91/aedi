import { resolveIdea2BrowserClient } from '@sep6/idea2-browser-client';
import type { staticSite } from '@sep6/idea2-test-cases';
import { useState } from 'react';
// import { CognitoUserPool } from 'amazon-cognito-identity-js';

const clientConfig = resolveIdea2BrowserClient<typeof staticSite>();
// const userPool = new CognitoUserPool({
//   // UserPoolId: clientConfig?.userPool.userPoolId,
//   // ClientId: clientConfig?.userPool.,
// });

export function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [healthy, setHealthy] = useState(false);

  return (
    <div>
      <h1>Welcome</h1>
      <h2>{clientConfig?.title}</h2>
      {healthy && <div className="healthy">Healthy</div>}
      <button
        onClick={async () => {
          const response = await fetch(`${clientConfig?.api.url}/healthcheck`);
          const json = await response.json();
          setHealthy(json?.healthy);
        }}
      >
        Healthcheck
      </button>

      {userId ? (
        <ContactsApp userId={userId} />
      ) : (
        <>
          <form
            id="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const username = formData.get('username') as string;
              const password = formData.get('password') as string;

              // TODO
            }}
          >
            <h3>Login</h3>
            <label htmlFor="username">Username</label>
            <input name="username" type="text" placeholder="Username" />
            <label htmlFor="password">Password</label>
            <input name="password" type="password" placeholder="Password" />
            <button type="submit">Login</button>
          </form>
          <form
            id="register-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const username = formData.get('username') as string;
              const password = formData.get('password') as string;

              // TODO
            }}
          >
            <h3>Register</h3>
            <label htmlFor="username">Username</label>
            <input name="username" type="text" placeholder="Username" />
            <label htmlFor="password">Password</label>
            <input name="password" type="password" placeholder="Password" />
            <button type="submit">Submit</button>
          </form>
        </>
      )}
    </div>
  );
}

function ContactsApp({ userId }: { userId: string }) {
  return <div>TODO: Add contacts app for user: {userId}</div>;
}

export default App;

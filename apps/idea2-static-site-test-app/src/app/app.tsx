import { resolveIdea2BrowserClient } from '@sep6/idea2-browser-client';
import type { staticSite } from '@sep6/idea2-test-cases';
import { useState } from 'react';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
  ISignUpResult,
} from 'amazon-cognito-identity-js';

const clientConfig = resolveIdea2BrowserClient<typeof staticSite>(); // TODO: Add local dev config
const userPool = new CognitoUserPool({
  UserPoolId: clientConfig?.userPool.userPoolId as string,
  ClientId: clientConfig?.userPool.userPoolClientId as string,
});

export function App() {
  const [healthy, setHealthy] = useState(false);
  const [user, setUser] = useState<CognitoUser | null>(
    userPool.getCurrentUser()
  );

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

      {user ? (
        <ContactsApp
          user={user}
          onSignOut={async () => {
            await new Promise((resolve) => user.signOut(resolve as () => void));
            setUser(null);
          }}
        />
      ) : (
        <>
          <LoginForm onLogin={setUser} />
          <RegisterForm onRegister={setUser} />
        </>
      )}
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin(user: CognitoUser): void }) {
  return (
    <form
      id="login-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        const user = new CognitoUser({
          Username: username,
          Pool: userPool,
        });

        const { userConfirmationNecessary } = await new Promise<{
          session: CognitoUserSession;
          userConfirmationNecessary?: boolean;
        }>((resolve, reject) =>
          user.authenticateUser(
            new AuthenticationDetails({
              Username: username,
              Password: password,
            }),
            {
              onSuccess: (session, userConfirmationNecessary) =>
                resolve({ session, userConfirmationNecessary }),
              onFailure: reject,
            }
          )
        );

        if (userConfirmationNecessary) {
          throw new Error('TODO: Add user confirmation');
        }

        // TODO: Add error handling

        onLogin(user);
      }}
    >
      <h3>Login</h3>
      <label htmlFor="username">Username</label>
      <input name="username" type="text" placeholder="Username" />
      <label htmlFor="password">Password</label>
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}

function RegisterForm({ onRegister }: { onRegister(user: CognitoUser): void }) {
  return (
    <form
      id="register-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        const signUpResult = await new Promise<ISignUpResult | undefined>(
          (resolve, reject) => {
            userPool.signUp(username, password, [], [], (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          }
        );

        if (!signUpResult) {
          throw new Error(`Sign-up result is falsy.`);
        }

        // TODO: Add error handling

        onRegister(signUpResult.user);
      }}
    >
      <h3>Register</h3>
      <label htmlFor="username">Username</label>
      <input name="username" type="text" placeholder="Username" />
      <label htmlFor="password">Password</label>
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Submit</button>
    </form>
  );
}

function ContactsApp({
  user,
  onSignOut,
}: {
  user: CognitoUser;
  onSignOut(): void;
}) {
  return (
    <div id="contacts-app">
      <button onClick={onSignOut}>Logout</button>
      TODO: Add contacts app for user: {user.getUsername()}
    </div>
  );
}

export default App;

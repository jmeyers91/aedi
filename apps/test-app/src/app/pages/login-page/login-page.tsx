import {
  CognitoUser,
  CognitoUserSession,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import { userPool } from '../../utils/cognito-utils';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import style from './login-page.module.css';

export function LoginPage() {
  const { setUser } = useContext(AuthContext);

  return (
    <div className={style.LoginPage}>
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
              },
            ),
          );

          if (userConfirmationNecessary) {
            throw new Error('TODO: Add user confirmation');
          }

          // TODO: Add error handling

          setUser(user);
        }}
      >
        <h3>Login</h3>
        <label htmlFor="username">Username</label>
        <input name="username" type="text" placeholder="Username" />
        <label htmlFor="password">Password</label>
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      <Link to="/register">Register</Link>
    </div>
  );
}

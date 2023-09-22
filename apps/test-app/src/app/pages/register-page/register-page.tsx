import {
  ISignUpResult,
  CognitoUserSession,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import { userPool } from '../../../utils/cognito-utils';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function RegisterPage() {
  const { setUser } = useContext(AuthContext);

  return (
    <div>
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
          const { userConfirmationNecessary } = await new Promise<{
            session: CognitoUserSession;
            userConfirmationNecessary?: boolean;
          }>((resolve, reject) =>
            signUpResult.user.authenticateUser(
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

          setUser(signUpResult.user);
        }}
      >
        <h3>Register</h3>
        <label htmlFor="username">Username</label>
        <input name="username" type="text" placeholder="Username" />
        <label htmlFor="password">Password</label>
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Submit</button>
      </form>
      <Link to="/login">Back</Link>
    </div>
  );
}

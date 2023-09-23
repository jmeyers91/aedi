import {
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { clientConfig } from '../client-config';

export const userPool = new CognitoUserPool({
  UserPoolId: clientConfig?.userPool.userPoolId as string,
  ClientId: clientConfig?.userPool.userPoolClientId as string,
});

export async function getUserAuthHeaders(
  user: CognitoUser | null | undefined = userPool.getCurrentUser(),
): Promise<{ Authorization: string } | {}> {
  const session = await new Promise<CognitoUserSession | null>(
    (resolve, reject) => {
      user?.getSession(
        (error: Error | null, session: CognitoUserSession | null) => {
          if (error) {
            reject(error);
          } else {
            resolve(session);
          }
        },
      );
    },
  );

  if (!session) {
    return {};
  }

  const jwt = session?.getIdToken().getJwtToken();

  return { Authorization: `Bearer ${jwt}` };
}

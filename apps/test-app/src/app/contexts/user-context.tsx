import { CognitoUser } from 'amazon-cognito-identity-js';
import { createContext } from 'react';

export const UserContext = createContext<{
  user: CognitoUser | null;
  setUser(user: CognitoUser | null): void;
}>({
  user: null,
  setUser() {},
});

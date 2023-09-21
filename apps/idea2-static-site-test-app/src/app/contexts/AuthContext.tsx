import { CognitoUser } from 'amazon-cognito-identity-js';
import { createContext } from 'react';

export const AuthContext = createContext<{
  user: CognitoUser | null;
  setUser(user: CognitoUser): void;
  logout(): void;
}>({
  user: null,
  setUser() {},
  logout() {},
});

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CognitoUser,
  CognitoUserSession,
  AuthenticationDetails,
  ISignUpResult,
} from 'amazon-cognito-identity-js';
import { userPool } from '../utils/cognito-utils';
import { useContext } from 'react';
import { UserContext } from '../contexts/user-context';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '../components/error-components';

export function useLogin() {
  const { setUser } = useContext(UserContext);

  return useMutation(
    async ({ username, password }: { username: string; password: string }) => {
      try {
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

        setUser(user);

        return user;
      } catch (error) {
        console.error(error);
        throw getAuthError(error);
      }
    },
  );
}

export function useRegister() {
  const login = useLogin();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation(
    async ({
      username,
      password,
      passwordConfirmed,
    }: {
      username: string;
      password: string;
      passwordConfirmed: string;
    }) => {
      if (password !== passwordConfirmed) {
        throw new Error("Passwords don't match.");
      }

      if (username.length === 0) {
        throw new Error(`Username is required.`);
      }

      const signUpResult = await new Promise<ISignUpResult | undefined>(
        (resolve, reject) => {
          userPool.signUp(username, password, [], [], (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        },
      );

      if (!signUpResult) {
        throw new Error(`Sign-up result is falsy.`);
      }

      await login.mutateAsync({ username, password });
    },
    {
      onSuccess() {
        enqueueSnackbar({
          variant: 'success',
          message: 'Registered',
        });
      },
    },
  );
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { user, setUser } = useContext(UserContext);
  const { enqueueSnackbar } = useSnackbar();

  return useMutation(
    async () => {
      if (!user) {
        return;
      }

      return user.signOut();
    },
    {
      onSuccess() {
        setUser(null);
        queryClient.clear();
      },
      onError(error) {
        enqueueSnackbar({
          variant: 'error',
          message: `Logout failed: ${getErrorMessage(error)}`,
        });
      },
    },
  );
}

function getAuthError(error: unknown): unknown {
  if (!error || typeof error !== 'object') {
    return error;
  }
  const errorCode = 'code' in error ? error.code : null;

  if (errorCode === 'InvalidParameterException') {
    const match = (error as any).message.match(
      /Missing required parameter (.+)/,
    );
    if (match) {
      return new Error(
        `${capitalizeFirst(match[1].toLowerCase())} is required.`,
      );
    }
  }

  if (errorCode === 'UserNotFoundException') {
    return new Error('Incorrect username or password.');
  }

  return error;
}

function capitalizeFirst(value: string): string {
  if (!value.length) return value;
  return value[0].toUpperCase() + value.slice(1);
}

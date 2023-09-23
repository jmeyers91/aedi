import { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from './utils/cognito-utils';
import { UserContext } from './contexts/user-context';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

export function App() {
  const [user, setUser] = useState<CognitoUser | null>(
    userPool.getCurrentUser(),
  );

  return (
    <SnackbarProvider>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <UserContext.Provider value={{ user, setUser }}>
          <RouterProvider router={router} />
        </UserContext.Provider>
      </QueryClientProvider>
    </SnackbarProvider>
  );
}

export default App;

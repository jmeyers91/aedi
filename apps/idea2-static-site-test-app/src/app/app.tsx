import { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '../utils/cognito-utils';
import { AuthContext } from './contexts/AuthContext';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function App() {
  const [user, setUser] = useState<CognitoUser | null>(
    userPool.getCurrentUser()
  );

  const logout = () => {
    if (!user) {
      return;
    }
    user.signOut();
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, logout, setUser }}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;

import '@aws-amplify/ui-react/styles.css';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getClientConfig } from '@sep6/client-config';
import App from './app/app';

Amplify.configure({
  Auth: getClientConfig().auth,
});

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <div hidden>
      <Authenticator />
    </div>
    <QueryClientProvider client={queryClient}>
      <Authenticator.Provider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Authenticator.Provider>
    </QueryClientProvider>
  </StrictMode>
);

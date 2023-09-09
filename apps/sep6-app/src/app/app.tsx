import { getModuleClient } from '../module-client';

import { Route, Routes, Link } from 'react-router-dom';

export function App() {
  return (
    <div>
      <button
        onClick={async () => {
          const response = await getModuleClient('HealthcheckModule').get(
            '/healthcheck'
          );
          console.log('Healthcheck success', response.data);
        }}
      >
        Healthcheck
      </button>
      <button
        onClick={async () => {
          const response = await getModuleClient('ContactModule').get(
            '/contacts',
            {
              headers: {
                Authorization: 'jim',
              },
            }
          );
          console.log('Contact list', response.data);
        }}
      >
        List contacts
      </button>
      <button
        onClick={async () => {
          const response = await getModuleClient('UserModule').get('/user', {
            headers: {
              Authorization: 'jim',
            },
          });
          console.log('Contact list', response.data);
        }}
      >
        Get current user
      </button>
      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/page-2">Page 2</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              This is the generated root route.{' '}
              <Link to="/page-2">Click here for page 2.</Link>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div>
              <Link to="/">Click here to go back to root page.</Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

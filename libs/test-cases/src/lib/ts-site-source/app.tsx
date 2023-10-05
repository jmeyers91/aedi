import React from 'react';
import { createRoot } from 'react-dom/client';
import './client-config';

export function App(): JSX.Element {
  return (
    <div>
      <h1>Static Website with React</h1>
    </div>
  );
}

createRoot(document.getElementById('app')!).render(<App />);

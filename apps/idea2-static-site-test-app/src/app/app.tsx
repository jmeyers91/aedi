import { resolveIdea2BrowserClient } from '@sep6/idea2-browser-client';
import type { staticSite } from '@sep6/idea2-test-cases';
import { useState } from 'react';

const clientConfig = resolveIdea2BrowserClient<typeof staticSite>();

export function App() {
  const [healthy, setHealthy] = useState(false);

  return (
    <div>
      <h1>Welcome</h1>
      <h2>{clientConfig?.title}</h2>
      {healthy && <div className="healthy">Healthy</div>}
      <button
        onClick={async () => {
          const response = await fetch(`${clientConfig?.api.url}/healthcheck`);
          const json = await response.json();
          setHealthy(json?.healthy);
        }}
      >
        Healthcheck
      </button>
    </div>
  );
}

export default App;

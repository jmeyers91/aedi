import { ClientConfig } from './client-config';

let cachedClientConfig: ClientConfig;

export function getClientConfig(): ClientConfig {
  if (cachedClientConfig) {
    return cachedClientConfig;
  }

  const clientConfig = (window as { __clientConfig?: ClientConfig })
    ?.__clientConfig;

  if (!clientConfig) {
    throw new Error(`Could not find client config.`);
  }

  cachedClientConfig = clientConfig;

  return clientConfig;
}

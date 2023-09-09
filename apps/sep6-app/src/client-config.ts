export interface ClientConfig {
  apiUrl: string;
}

export const clientConfig = resolveClientConfig();

function resolveClientConfig(): ClientConfig {
  const configContainer = window as { __clientConfig?: ClientConfig };
  if (configContainer.__clientConfig) {
    return configContainer.__clientConfig;
  }
  return (
    configContainer.__clientConfig ?? {
      apiUrl: '/',
    }
  );
}

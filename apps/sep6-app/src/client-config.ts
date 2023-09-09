export interface ApiConfig {
  ContactModule: {
    baseURL: string;
  };
  HealthcheckModule: {
    baseURL: string;
  };
  UserModule: {
    baseURL: string;
  };
  AdminModule: {
    baseURL: string;
  };
}

export interface ClientConfig {
  api: ApiConfig;
}

export const clientConfig = resolveClientConfig();

function resolveClientConfig(): ClientConfig {
  const configContainer = window as { __clientConfig?: ClientConfig };
  if (configContainer.__clientConfig) {
    return configContainer.__clientConfig;
  }
  if (configContainer.__clientConfig) {
    return configContainer.__clientConfig;
  }
  const localModule = { baseURL: '/' };
  return {
    api: {
      ContactModule: localModule,
      HealthcheckModule: localModule,
      UserModule: localModule,
      AdminModule: localModule,
    },
  };
}

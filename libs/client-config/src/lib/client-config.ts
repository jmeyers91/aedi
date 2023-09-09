export interface ClientConfig {
  auth?: {
    region: string;
    userPoolId: string;
    userPoolWebClientId: string;
  };
  api: {
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
  };
}

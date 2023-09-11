import { BucketId, TableId } from '@sep6/constants';

export interface ClientConfig {
  auth?: {
    region: string;
    userPoolId: string;
    userPoolWebClientId: string;
    identityPoolId: string;
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
  buckets: {
    [K in BucketId]?: {
      bucketName: string;
      region: string;
    };
  };
  tables: {
    [K in TableId]?: {
      tableName: string;
      region: string;
    };
  };
}

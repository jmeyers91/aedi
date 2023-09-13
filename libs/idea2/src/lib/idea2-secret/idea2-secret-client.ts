/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResolvedClientRef } from '../idea2-types';
import { SecretClientRef } from './idea2-secret-types';

/**
 * Fetch a secret using the lambda secret plugin.
 * See: https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html
 */
export async function getSecretValue<T extends SecretClientRef<any, any>>({
  constructRef: { secretName },
}: ResolvedClientRef<T>): Promise<string> {
  const port = +(process.env['PARAMETERS_SECRETS_EXTENSION_HTTP_PORT'] ?? 2773);
  const response = await fetch(
    `http://localhost:${port}/secretsmanager/get?secretId=${encodeURIComponent(
      secretName
    )}`,
    {
      headers: {
        'X-Aws-Parameters-Secrets-Token':
          process.env['AWS_SESSION_TOKEN'] ?? '',
      },
    }
  );
  const data: { SecretString: string } = await response.json();
  return data.SecretString;
}

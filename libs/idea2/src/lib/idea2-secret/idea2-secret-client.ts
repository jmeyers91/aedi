/* eslint-disable @typescript-eslint/no-explicit-any */
import { mapRef } from '../idea2-resource-utils';
import { SecretClientRef, SecretRef } from './idea2-secret-types';

/**
 * Maps a secret ref into its decoded secret string.
 * Uses the lambda secret plugin for caching.
 */
export function SecretValue<R extends SecretRef | SecretClientRef<any, any>>(
  ref: R
) {
  return mapRef(ref, async ({ constructRef: { secretName } }) => {
    const port = +(
      process.env['PARAMETERS_SECRETS_EXTENSION_HTTP_PORT'] ?? 2773
    );
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
  });
}

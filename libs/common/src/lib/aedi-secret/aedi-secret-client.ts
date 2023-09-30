import { mapRef, once } from '../aedi-resource-utils';
import { SecretClientRef, SecretRef } from './aedi-secret-types';

/**
 * Maps a secret ref into its decoded secret string.
 * Uses the lambda secret plugin for caching.
 */
export function SecretValue<R extends SecretRef | SecretClientRef<any, any>>(
  ref: R,
) {
  return mapRef(ref, async ({ constructRef: { secretName } }) => {
    const port = +(
      process.env['PARAMETERS_SECRETS_EXTENSION_HTTP_PORT'] ?? 2773
    );
    const response = await fetch(
      `http://localhost:${port}/secretsmanager/get?secretId=${encodeURIComponent(
        secretName,
      )}`,
      {
        headers: {
          'X-Aws-Parameters-Secrets-Token':
            process.env['AWS_SESSION_TOKEN'] ?? '',
        },
      },
    );
    const data: { SecretString: string } = await response.json();
    return data.SecretString;
  });
}

export function LazySecretValue<
  R extends SecretRef | SecretClientRef<any, any>,
>(ref: R) {
  return mapRef(ref, ({ constructRef: { secretName } }) =>
    once(async () => {
      const port = +(
        process.env['PARAMETERS_SECRETS_EXTENSION_HTTP_PORT'] ?? 2773
      );
      const response = await fetch(
        `http://localhost:${port}/secretsmanager/get?secretId=${encodeURIComponent(
          secretName,
        )}`,
        {
          headers: {
            'X-Aws-Parameters-Secrets-Token':
              process.env['AWS_SESSION_TOKEN'] ?? '',
          },
        },
      );
      const data: { SecretString: string } = await response.json();
      return data.SecretString;
    }),
  );
}

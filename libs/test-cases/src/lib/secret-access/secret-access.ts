import { Lambda, Secret, SecretValue } from '@aedi/common';
import { Scope } from '../app';

const scope = Scope('secret-access');

/**
 * Secret name: aedi-example-secret
 * This secret is only used for testing.
 */
export const secretArn =
  'arn:aws:secretsmanager:us-west-2:664290008299:secret:aedi-example-secret-lczQt1';

const secret = Secret(scope, 'secret', {
  arn: secretArn,
});

export const getSecretArn = Lambda(
  scope,
  'getSecretArn',
  { secret },
  ({ secret }) => secret.constructRef.secretName,
);

export const getSecretValue = Lambda(
  scope,
  'getSecretValue',
  { secret: SecretValue(secret) },
  ({ secret }) => secret,
);

import { Lambda, Secret, SecretValue } from '@sep6/idea2';
import { Scope } from '../idea';

const scope = Scope('secret-access');

/**
 * Secret name: idea2-example-secret
 * This secret is only used for testing.
 */
export const secretArn =
  'arn:aws:secretsmanager:us-west-2:664290008299:secret:idea2-example-secret-JTkxFp';

const secret = Secret(scope, 'secret', {
  arn: secretArn,
});

export const getSecretArn = Lambda(
  scope,
  'getSecretArn',
  { secret },
  ({ secret }) => secret.constructRef.secretName
);

export const getSecretValue = Lambda(
  scope,
  'getSecretValue',
  { secret: SecretValue(secret) },
  ({ secret }) => secret
);

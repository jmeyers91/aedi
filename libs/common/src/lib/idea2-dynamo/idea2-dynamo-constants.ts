import { DynamoRefClientOptions } from './idea2-dynamo-types';

/**
 * These are the permissions used by dynamo tables that are passed to lambdas without calling any of the
 * permission modifier functions on the dynamo table.
 * Lambdas can read from their dependency tables by default.
 */
export const defaultDynamoRefClientOptions = {
  read: true,
} as const satisfies DynamoRefClientOptions;

import { resolveComputeDependencies } from '../aedi-client-utils';
import { AnyFargateServiceRef } from './aedi-fargate-service-types';

export function getFargateServiceRefHandler(
  serviceRef: Pick<AnyFargateServiceRef, 'uid' | 'context' | 'image'>,
): () => Promise<unknown> {
  return async () => {
    try {
      console.log(`Fargate service handler for ${serviceRef.uid}`);
      const dependencies = await resolveComputeDependencies(serviceRef.context);

      if (typeof serviceRef.image !== 'function') {
        throw new Error(
          `Invalid image for fargate service: ${serviceRef.uid} - must be a function.`,
        );
      }

      return await serviceRef.image(dependencies);
    } catch (err) {
      console.error(err);

      throw err;
    }
  };
}

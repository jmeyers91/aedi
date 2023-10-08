import type {
  FargateServiceRef,
  FargateServiceHandlerLocation,
  FargateServiceDependencyGroup,
  FargateServiceImage,
} from './aedi-fargate-service-types';
import { RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';
import { getFargateServiceRefHandler } from './aedi-fargate-service-handler';

export function FargateService<const C extends FargateServiceDependencyGroup>(
  scope: Scope,
  id: string,
  options: Pick<
    FargateServiceRef<C>,
    'cluster' | 'healthcheck' | 'port' | 'loadBalanced'
  >,
  context: C,
  image: FargateServiceImage<C>,
): FargateServiceRef<C> {
  const service = createResource<FargateServiceRef<C>>(
    RefType.FARGATE_SERVICE,
    scope,
    id,
    { ...options, loadBalanced: options.loadBalanced ?? true, context, image },
  );

  // Can be overridden
  const initialLocation: FargateServiceHandlerLocation = {
    filepath: service.filepath,
    exportKey: `index.${service.id}.handler`,
  };
  service.handlerLocation = initialLocation;

  /**
   * Automatically execute the service if the current execution context is the service's container.
   */
  if (process.env['AEDI_COMPUTE_UID'] === service.uid) {
    service.handler = getFargateServiceRefHandler(service);
    process.nextTick(() => service.handler?.());
  }

  return service;
}

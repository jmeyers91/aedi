import type {
  FargateServiceRef,
  FargateServiceHandlerLocation,
  FargateServiceDependencyGroup,
  FargateServiceRefFn,
} from './aedi-fargate-service-types';
import { RefType, Scope } from '../aedi-types';
import { createResource } from '../aedi-resource-utils';

export function FargateService<const C extends FargateServiceDependencyGroup>(
  scope: Scope,
  id: string,
  context: C,
  fn: FargateServiceRefFn<C>,
): FargateServiceRef<C> {
  const service = createResource<FargateServiceRef<C>>(
    RefType.FARGATE_SERVICE,
    scope,
    id,
    {
      context,
      fn,
    },
  );

  // Can be overridden by lambda handler proxies
  const initialLocation: FargateServiceHandlerLocation = {
    filepath: service.filepath,
    exportKey: `index.${service.id}.fn`,
  };
  service.handlerLocation = initialLocation;

  if (process.env['AEDI_FARGATE_EXECUTE_SERVICE_UID'] === service.uid) {
    console.log(`Executing fargate service: ${service.uid}`);
    process.nextTick(() =>
      // TODO: Add dependency resolution
      fn({} as any),
    );
  }

  return service;
}

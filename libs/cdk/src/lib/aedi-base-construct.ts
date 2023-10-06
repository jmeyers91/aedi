import {
  LookupConstructRef,
  LookupRef,
  RefType,
  ResourceRef,
} from '@aedi/common';
import { Construct } from 'constructs';
import { IComputeDependency } from './aedi-infra-types';

export abstract class AediBaseConstruct<R extends RefType>
  extends Construct
  implements IComputeDependency<LookupConstructRef<R>>
{
  public readonly resourceRef: LookupRef<R>;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef }: { resourceRef: ResourceRef },
  ) {
    super(scope, id);

    this.resourceRef = resourceRef;
  }

  abstract getConstructRef(): LookupConstructRef<R>;
}

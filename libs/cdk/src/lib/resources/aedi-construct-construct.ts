import { ConstructConstructRef, ConstructRef, RefType } from '@aedi/common';
import { Construct } from 'constructs';
import { IComputeDependency } from '../aedi-infra-types';
import { AediBaseConstruct } from '../aedi-base-construct';

export class AediConstruct
  extends AediBaseConstruct<RefType.CONSTRUCT>
  implements IComputeDependency<ConstructConstructRef>
{
  public readonly constructRef: ConstructRef;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: ConstructRef },
  ) {
    super(scope, id, props);

    this.constructRef = this.resourceRef;
  }

  getConstructRef(): object {
    return {};
  }
}

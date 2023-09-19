import { ConstructConstructRef, ConstructRef, RefType } from '@sep6/idea2';
import { Construct } from 'constructs';
import { ILambdaDependency } from '../idea2-infra-types';
import { Idea2BaseConstruct } from '../idea2-base-construct';

export class Idea2Construct
  extends Idea2BaseConstruct<RefType.CONSTRUCT>
  implements ILambdaDependency<ConstructConstructRef>
{
  public readonly constructRef: ConstructRef;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: ConstructRef }
  ) {
    super(scope, id, props);

    this.constructRef = this.resourceRef;
  }

  getConstructRef(): object {
    return {};
  }

  grantLambdaAccess(): void {}
}

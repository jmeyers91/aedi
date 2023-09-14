import { ConstructConstructRef, ConstructRef } from '@sep6/idea2';
import { Construct } from 'constructs';
import { ILambdaDependency } from '../idea2-infra-types';

export class Idea2Construct
  extends Construct
  implements ILambdaDependency<ConstructConstructRef>
{
  public readonly constructRef: ConstructRef;

  constructor(
    scope: Construct,
    id: string,
    { resourceRef: constructRef }: { resourceRef: ConstructRef }
  ) {
    super(scope, id);

    this.constructRef = constructRef;
  }

  getConstructRef(): object {
    return {};
  }
}

import {
  LookupConstructRef,
  LookupRef,
  RefType,
  ResourceRef,
} from '@aedi/idea2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export abstract class Idea2BaseConstruct<R extends RefType> extends Construct {
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

  abstract grantLambdaAccess(lambda: { lambdaFunction: NodejsFunction }): void;
}

import { Construct } from 'constructs';
import {
  CustomResourceConstructRef,
  CustomResourceRef,
  RefType,
} from '@aedi/common';
import { ILambdaDependency } from '../aedi-infra-types';
import { AediLambdaFunction } from './aedi-lambda-construct';
import { AediBaseConstruct } from '../aedi-base-construct';
import { resolveConstruct } from '../aedi-infra-utils';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { CustomResource } from 'aws-cdk-lib';

export class AediCustomResource
  extends AediBaseConstruct<RefType.CUSTOM_RESOURCE>
  implements ILambdaDependency<CustomResourceConstructRef>
{
  public readonly customResourceRef: CustomResourceRef<any, any>;
  public readonly result: string;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: CustomResourceRef<any, any> },
  ) {
    super(scope, id, props);

    const customResourceRef = (this.customResourceRef = this.resourceRef);
    const lambda = resolveConstruct(customResourceRef.lambda);

    const provider = new Provider(this, 'resource-provider', {
      onEventHandler: lambda.lambdaFunction,
    });

    const customResource = new CustomResource(this, 'custom-resource', {
      serviceToken: provider.serviceToken,

      properties: {
        timestamp: new Date().toISOString(),
      },
    });

    this.result = customResource.getAttString('Result');
  }

  getConstructRef() {
    return this.result as any;
  }

  grantLambdaAccess(_lambda: AediLambdaFunction): void {
    // N/A
  }
}

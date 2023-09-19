import { Construct } from 'constructs';
import { RestApiRef, RestApiConstructRef, RefType } from '@sep6/idea2';
import { createConstructName, resolveConstruct } from '../idea2-infra-utils';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { ILambdaDependency } from '../idea2-infra-types';
import { Idea2BaseConstruct } from '../idea2-base-construct';

export class Idea2RestApi
  extends Idea2BaseConstruct<RefType.REST_API>
  implements ILambdaDependency<RestApiConstructRef>
{
  public readonly restApi: RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: RestApiRef }
  ) {
    super(scope, id, props);

    const restApiRef = this.resourceRef;

    this.restApi = new RestApi(this, restApiRef.id, {
      restApiName: createConstructName(restApiRef),
      defaultCorsPreflightOptions: {
        allowCredentials: true,
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    for (const route of restApiRef.routes) {
      const apiGatewayPath = route.path
        .split('/')
        .filter((it) => it.length > 0);
      const apiGatewayResource = apiGatewayPath.reduce(
        (resource, pathPart) =>
          resource.getResource(pathPart) ?? resource.addResource(pathPart),
        this.restApi.root
      );
      apiGatewayResource.addMethod(
        route.method,
        new LambdaIntegration(resolveConstruct(route.lambdaRef).lambdaFunction)
      );
    }
  }

  getConstructRef(): RestApiConstructRef {
    return {
      url: this.restApi.url,
    };
  }

  grantLambdaAccess() {
    // TODO: Anything to add here?
  }
}

import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RestApiRef, RefType } from '@sep6/idea2';
import { getIdea2StackContext } from './idea2-infra-utils';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Idea2LambdaFunction } from './idea2-lambda-construct';

export class Idea2RestApi extends Construct {
  static cachedFactory(scope: Construct, restApiRef: RestApiRef): Idea2RestApi {
    const cache = getIdea2StackContext(scope).getCache<Idea2RestApi>(
      RefType.REST_API
    );
    const cached = cache.get(restApiRef.id);
    if (cached) {
      return cached;
    }
    const restApi = new Idea2RestApi(
      Stack.of(scope),
      `rest-api-${restApiRef.id}`,
      {
        restApiRef,
      }
    );
    cache.set(restApiRef.id, restApi);
    return restApi;
  }

  public readonly restApi: RestApi;

  constructor(
    scope: Construct,
    id: string,
    { restApiRef }: { restApiRef: RestApiRef }
  ) {
    super(scope, id);

    this.restApi = new RestApi(this, restApiRef.id, {
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
        new LambdaIntegration(
          Idea2LambdaFunction.cachedFactory(
            this,
            route.lambdaRef
          ).lambdaFunction
        )
      );
    }
  }
}

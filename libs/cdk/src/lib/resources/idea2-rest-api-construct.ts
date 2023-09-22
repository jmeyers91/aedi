import { Construct } from 'constructs';
import {
  RestApiRef,
  RestApiConstructRef,
  RefType,
  AuthorizerRef,
  UserPoolRef,
} from '@aedi/common';
import { createConstructName, resolveConstruct } from '../idea2-infra-utils';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  MethodOptions,
  ResponseType,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { ILambdaDependency } from '../idea2-infra-types';
import { Idea2BaseConstruct } from '../idea2-base-construct';

export class Idea2RestApi
  extends Idea2BaseConstruct<RefType.REST_API>
  implements ILambdaDependency<RestApiConstructRef>
{
  public readonly restApi: RestApi;
  private readonly authorizers = new Map<string, CognitoUserPoolsAuthorizer>();

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: RestApiRef },
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

    this.restApi.addGatewayResponse('unauthorized-response', {
      type: ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
      templates: {
        'application/json':
          '{ "message": $context.error.messageString, "statusCode": "401", "type": "$context.error.responseType" }',
      },
    });

    for (const route of restApiRef.routes) {
      const apiGatewayPath = route.path
        .split('/')
        .filter((it) => it.length > 0);

      const apiGatewayResource = apiGatewayPath.reduce(
        (resource, pathPart) =>
          resource.getResource(pathPart) ?? resource.addResource(pathPart),
        this.restApi.root,
      );

      const routeOptions: {
        -readonly [K in keyof MethodOptions]: MethodOptions[K];
      } = {};

      const authorizers = Object.values(route.lambdaRef.context).filter(
        (value): value is AuthorizerRef =>
          !!(
            value &&
            typeof value === 'object' &&
            'authorizedUserPool' in value
          ),
      );

      // Add the cognito authorizer
      if (authorizers.length > 0) {
        routeOptions.authorizer = this.resolveAuthorizer(
          authorizers.map((it) => it.authorizedUserPool),
        );
        routeOptions.authorizationType = AuthorizationType.COGNITO;
      }

      apiGatewayResource.addMethod(
        route.method,
        new LambdaIntegration(resolveConstruct(route.lambdaRef).lambdaFunction),
        routeOptions,
      );
    }
  }

  /**
   * Manages the authorizer cache. This is used to avoid creating unnecessary duplicate authorizer constructs.
   */
  resolveAuthorizer(userPools: UserPoolRef[]): CognitoUserPoolsAuthorizer {
    const key = userPools
      .map((it) => it.uid)
      .sort()
      .join(',');
    let authorizer = this.authorizers.get(key);

    if (!authorizer) {
      authorizer = new CognitoUserPoolsAuthorizer(
        this,
        `cognito-authorizer-${userPools.map((pool) => pool.id).join('-')}`,
        {
          cognitoUserPools: userPools.map(
            (ref) => resolveConstruct(ref).userPool,
          ),
        },
      );
      this.authorizers.set(key, authorizer);
    }

    return authorizer;
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

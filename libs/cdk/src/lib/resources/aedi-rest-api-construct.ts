import { Construct } from 'constructs';
import {
  RestApiRef,
  RestApiConstructRef,
  RefType,
  AuthorizerRef,
  UserPoolRef,
} from '@aedi/common';
import {
  NotReadOnly,
  createConstructName,
  resolveConstruct,
} from '../aedi-infra-utils';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  MethodOptions,
  PassthroughBehavior,
  ResponseType,
  RestApi,
  RestApiProps,
} from 'aws-cdk-lib/aws-apigateway';
import { ILambdaDependency } from '../aedi-infra-types';
import { AediBaseConstruct } from '../aedi-base-construct';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  ARecord,
  PublicHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';

export class AediRestApi
  extends AediBaseConstruct<RefType.REST_API>
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
    const domain = restApiRef.domain
      ? {
          name: restApiRef.domain.name,
          zone: PublicHostedZone.fromLookup(this, 'domain-zone', {
            domainName: restApiRef.domain.zone,
          }),
        }
      : null;

    const restApiProps: NotReadOnly<RestApiProps> = {
      restApiName: createConstructName(restApiRef),
      defaultCorsPreflightOptions: {
        allowCredentials: true,
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
    };

    if (restApiRef.binaryMediaTypes) {
      restApiProps.binaryMediaTypes = restApiRef.binaryMediaTypes;
    }

    if (domain) {
      restApiProps.domainName = {
        domainName: domain.name,
        certificate: new Certificate(this, 'domain-cert', {
          domainName: domain.name,
          validation: CertificateValidation.fromDns(domain.zone),
        }),
      };
    }

    this.restApi = new RestApi(this, restApiRef.id, restApiProps);

    if (domain) {
      new ARecord(this, 'domain-a-record', {
        recordName: domain.name,
        target: RecordTarget.fromAlias(new ApiGateway(this.restApi)),
        zone: domain.zone,
      });
    }

    this.restApi.addGatewayResponse('bad-request-body-response', {
      type: ResponseType.BAD_REQUEST_BODY,
      statusCode: '400',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
      templates: {
        'application/json':
          '{ "message": "$context.error.validationErrorString", "statusCode": "400", "type": "$context.error.responseType" }',
      },
    });

    this.restApi.addGatewayResponse('bad-request-params-response', {
      type: ResponseType.BAD_REQUEST_PARAMETERS,
      statusCode: '400',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
      templates: {
        'application/json':
          '{ "message": $context.error.messageString, "statusCode": "400", "type": "$context.error.responseType" }',
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

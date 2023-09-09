import {
  CorsOptions,
  ResponseType,
  RestApi,
  RestApiProps,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { DnsManager } from './dns-manager';
import { DomainId } from '@sep6/constants';

interface Props
  extends Omit<
    RestApiProps,
    'domainName' | 'restApiName' | 'defaultCorsPreflightOptions'
  > {
  envName: string;
  domain: DomainId | null | undefined;
  dnsManager: DnsManager;
  defaultCorsOrigins: string[];
}

export class NestRestApi extends RestApi {
  constructor(
    scope: Construct,
    id: string,
    { envName, domain, dnsManager, defaultCorsOrigins, ...props }: Props
  ) {
    const restApiName = domain
      ? `${envName}-${domain.toLowerCase().replace(/_/g, '-')}`
      : envName;
    const certifiedDomain = dnsManager.getDomainCert(domain);
    const defaultCorsPreflightOptions: CorsOptions = {
      allowCredentials: true,
      allowOrigins: defaultCorsOrigins,
    };

    super(scope, id, {
      restApiName,
      defaultCorsPreflightOptions,
      ...props,
      ...(certifiedDomain
        ? {
            domainName: {
              domainName: certifiedDomain.domainPair.domainName,
              certificate: certifiedDomain.certificate,
            },
          }
        : {}),
    });

    this.addGatewayResponse('unauthorized-response', {
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
  }
}

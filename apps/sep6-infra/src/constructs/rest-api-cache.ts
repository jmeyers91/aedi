import { DomainId } from '@sep6/constants';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

const NO_DOMAIN = Symbol('NO_DOMAIN');

export class RestApiCache extends Construct {
  private readonly restApis = new Map<string | typeof NO_DOMAIN, RestApi>();

  constructor(
    scope: Construct,
    id: string,
    private readonly restApiFactory: (
      cacheScope: RestApiCache,
      metadataDomainId: DomainId | null
    ) => RestApi
  ) {
    super(scope, id);
  }

  findOrCreateRestApi(metadataDomainId: DomainId | null | undefined): RestApi {
    const cacheKey = metadataDomainId ?? NO_DOMAIN;
    let cachedRestApi: RestApi | undefined = this.restApis.get(cacheKey);

    if (!cachedRestApi) {
      cachedRestApi = this.restApiFactory(this, metadataDomainId ?? null);
      this.restApis.set(cacheKey, cachedRestApi);
    }

    return cachedRestApi;
  }
}

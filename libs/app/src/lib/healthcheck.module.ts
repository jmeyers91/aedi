import { DynamicModule } from '@nestjs/common';
import { HealthcheckController } from './healthcheck.controller';
import { LambdaModule } from '@sep6/utils';
import { CountTableModule } from './tables/count.table';
import { DomainId } from '@sep6/constants';

export * from './healthcheck.controller';

@LambdaModule(
  {
    domainName: DomainId.API,
  },
  {
    imports: [CountTableModule.grant({ write: true })],
  }
)
export class HealthcheckModule {
  static withControllers(): DynamicModule {
    return { module: this, controllers: [HealthcheckController] };
  }
}

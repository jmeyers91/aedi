import { DynamicModule } from '@nestjs/common';
import { HealthcheckController } from './healthcheck.controller';
import { LambdaModule } from '@sep6/utils';
import { CountTableModule } from './resources/count-table.module';

export * from './healthcheck.controller';

@LambdaModule({
  imports: [CountTableModule.grant({ write: true })],
})
export class HealthcheckModule {
  static withControllers(): DynamicModule {
    return { module: this, controllers: [HealthcheckController] };
  }
}

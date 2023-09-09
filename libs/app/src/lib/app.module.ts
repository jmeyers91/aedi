import { Module } from '@nestjs/common';
import { HealthcheckModule } from './healthcheck.module';
import { ContactModule } from './contact.module';
import { UserModule } from './user.module';
import { withControllers } from '@sep6/utils';
import { PublicWebApp } from './web-apps/public.web-app';

export * from './healthcheck.controller';

@Module({
  imports: withControllers([
    HealthcheckModule,
    ContactModule,
    UserModule,
    PublicWebApp,
  ]),
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { HealthcheckModule } from './healthcheck.module';
import { ContactModule } from './contact.module';
import { UserModule } from './user.module';
import { withControllers } from '@sep6/utils';
import { Sep6WebApp } from './web-apps/sep6.web-app';
import { Sep6WebAdminApp } from './web-apps/sep6-admin.web-app';

export * from './healthcheck.controller';

@Module({
  imports: withControllers([
    Sep6WebApp,
    Sep6WebAdminApp,

    HealthcheckModule,
    ContactModule,
    UserModule,
  ]),
})
export class AppModule {}

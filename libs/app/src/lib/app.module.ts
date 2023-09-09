import { Module } from '@nestjs/common';
import { HealthcheckModule } from './modules/healthcheck/healthcheck.module';
import { ContactModule } from './modules/contact/contact.module';
import { withControllers } from '@sep6/utils';
import { Sep6WebApp } from './web-apps/sep6.web-app';
import { Sep6WebAdminApp } from './web-apps/sep6-admin.web-app';
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';

export * from './modules/healthcheck/healthcheck.controller';

@Module({
  imports: withControllers([
    Sep6WebApp,
    Sep6WebAdminApp,

    AdminModule,
    HealthcheckModule,
    ContactModule,
    UserModule,
  ]),
})
export class AppModule {}

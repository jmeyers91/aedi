import { Module } from '@nestjs/common';
import { HealthcheckModule } from './modules/healthcheck/healthcheck.module';
import { ContactModule } from './modules/contact/contact.module';
import { withControllers } from '@sep6/utils';
import { Sep6WebApp } from './web-apps/sep6.web-app';
import { Sep6WebAdminApp } from './web-apps/sep6-admin.web-app';
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';
import { AppUserPoolModule } from './user-pools/app.user-pool';
import { CountEventModule } from './modules/count-event/count-event.module';

export * from './modules/healthcheck/healthcheck.controller';

@Module({
  imports: withControllers([
    // User pools
    AppUserPoolModule,

    // Web apps
    Sep6WebApp,
    Sep6WebAdminApp,

    // API Lambdas
    AdminModule,
    HealthcheckModule,
    ContactModule,
    UserModule,

    // Free floating lambdas
    CountEventModule,
  ]),
})
export class AppModule {}

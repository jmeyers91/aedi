import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { ContactModule } from './contact.module';
import { AppController } from './app.controller';

export * from './app.controller';

@Module({
  imports: [UserModule, ContactModule],
  controllers: [AppController],
})
export class AppModule {}

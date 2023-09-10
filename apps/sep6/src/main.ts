import { AppModule } from '@sep6/app';
import { logNestTree } from '@sep6/utils';

async function bootstrap() {
  // logNestTree(AppModule);
  console.log({ AppModule });
}

bootstrap();

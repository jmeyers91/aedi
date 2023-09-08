import { AppModule } from '@sep6/app';
import { logNestTree } from '@sep6/utils';

async function bootstrap() {
  logNestTree(AppModule);

  // const lambdas = findLambdaModules(AppModule);

  // for (const lambda of lambdas) {
  //   console.log(`Lambda ${lambda.handlerFilePath}`);
  //   for (const bucket of findBucketModules(lambda.node.module)) {
  //     console.log(` -- Bucket: ${bucket.bucketId}`);
  //   }
  // }
}

bootstrap();

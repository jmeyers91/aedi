import { AppModule } from '@sep6/app';
import {
  BucketMetadata,
  LambdaMetadata,
  NestModule,
  NestNode,
  flatMapModule,
  getBucketMetadata,
  getLambdaMetadata,
  logNestTree,
} from '@sep6/utils';

async function bootstrap() {
  logNestTree(AppModule);

  const lambdas = findLambdaModules(AppModule);

  for (const lambda of lambdas) {
    console.log(`Lambda ${lambda.handlerFilePath}`);
    for (const bucket of findBucketModules(lambda.node.module)) {
      console.log(` -- Bucket: ${bucket.bucketId}`);
    }
  }
}

bootstrap();

function findLambdaModules(
  module: NestModule
): (LambdaMetadata & { node: NestNode })[] {
  return flatMapModule(module, (node) => {
    const lambda = getLambdaMetadata(node.module);
    if (lambda) {
      return [{ ...lambda, node }];
    }
    return [];
  });
}

function findBucketModules(
  module: NestModule
): (BucketMetadata & { node: NestNode })[] {
  return flatMapModule(module, (node) => {
    const bucket = getBucketMetadata(node.module);
    if (bucket) {
      return [{ ...bucket, node }];
    }
    return [];
  });
}

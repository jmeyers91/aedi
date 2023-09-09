/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Module,
  ModuleMetadata,
  NestModule,
  Type,
  applyDecorators,
} from '@nestjs/common';
import { callsites } from '../callsites';
import {
  LambdaMetadata,
  Resource,
  ResourceType,
  getResourceMetadata,
} from './resource-module';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { relative } from 'path';

export function LambdaModule(
  { handlerFilePath, ...rest }: Partial<LambdaMetadata>,
  metadata: ModuleMetadata
) {
  const absoluteHandlerFilePath =
    handlerFilePath ?? callsites()[1]?.getFileName();

  if (!absoluteHandlerFilePath) {
    throw new Error(`Unable to find lambda handler`);
  }

  const relativeHandlerFilePath = relative('.', absoluteHandlerFilePath);

  const addHandlerFunctionDecorator: ClassDecorator = (target: any) => {
    target.lambdaHandler = createNestLambdaHandler(
      target?.withControllers?.() ?? target
    );
  };

  return applyDecorators(
    Resource({
      ...rest,
      type: ResourceType.LAMBDA_FUNCTION,
      id: relativeHandlerFilePath,
      handlerFilePath: relativeHandlerFilePath,
    }),
    Module(metadata),
    addHandlerFunctionDecorator
  );
}

export function getLambdaMetadata(module: Type<any> | (() => void)) {
  return getResourceMetadata(module, ResourceType.LAMBDA_FUNCTION);
}

/**
 * Takes a Nestjs app module class and returns a API Gateway Lambda handler function for it.
 */
export function createNestLambdaHandler(appModule: NestModule): Handler {
  let server: Handler;

  const bootstrap = async (): Promise<Handler> => {
    const app = await NestFactory.create(appModule, {
      cors: true, // TODO: Add dynamic origin handling once domains are added
    });
    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    return serverlessExpress({ app: expressApp });
  };

  const handler: Handler = async (
    event: APIGatewayEvent,
    context: Context,
    callback: Callback
  ) => {
    server = server ?? (await bootstrap());
    return server(event, context, callback);
  };

  return handler;
}

export function withControllers(
  imports: Parameters<typeof Module>[0]['imports']
) {
  return imports?.map((module) =>
    'withControllers' in module && typeof module.withControllers === 'function'
      ? module.withControllers()
      : module
  );
}

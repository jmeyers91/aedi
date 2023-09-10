/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DynamicModule,
  INestApplicationContext,
  Module,
  ModuleMetadata,
  NestModule,
  Type,
  applyDecorators,
} from '@nestjs/common';
import { callsites } from '../callsites';
import {
  ILambdaEventHandler,
  LambdaMetadata,
  LambdaType,
  Resource,
  ResourceType,
  getResourceMetadata,
} from './resource-module';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { relative } from 'path';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const HANDLER_SERVICE = Symbol('HANDLER_SERVICE');

export function LambdaModule(
  metadata: ModuleMetadata,
  {
    handlerFilePath,
    lambdaType = LambdaType.API,
    handlerService,
    ...rest
  }: Partial<LambdaMetadata> = {}
) {
  const absoluteHandlerFilePath =
    handlerFilePath ?? callsites()[1]?.getFileName();

  if (!absoluteHandlerFilePath) {
    throw new Error(`Unable to find lambda handler`);
  }

  const relativeHandlerFilePath = relative('.', absoluteHandlerFilePath);

  const addHandlerFunctionDecorator: ClassDecorator = (target: any) => {
    if (lambdaType === LambdaType.API) {
      target.lambdaHandler = createNestApiLambdaHandler(
        target?.withControllers?.() ?? target
      );
    } else {
      if (!handlerService) {
        throw new Error(`Standard lambdas must include a handlerService`);
      }
      target.lambdaHandler = createNestLambdaHandler({
        module: target,
        providers: [{ provide: HANDLER_SERVICE, useClass: handlerService }],
      });
    }
  };

  return applyDecorators(
    Resource({
      ...rest,
      type: ResourceType.LAMBDA_FUNCTION,
      lambdaType,
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
export function createNestApiLambdaHandler(appModule: NestModule): Handler {
  let server: Handler;

  const bootstrap = async (): Promise<Handler> => {
    const cors = getCorsConfig();

    const app = await NestFactory.create(appModule, {
      cors,
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

/**
 * Takes a Nestjs app module class and returns a Lambda handler function for it.
 */
export function createNestLambdaHandler(
  appModule: NestModule | DynamicModule
): Handler {
  let lambdaEventHandler: ILambdaEventHandler;

  const bootstrap = async (): Promise<ILambdaEventHandler> => {
    const app = await NestFactory.createApplicationContext(appModule);
    return app.get(HANDLER_SERVICE) as ILambdaEventHandler;
  };

  const handler: Handler = async (
    event: unknown,
    context: Context,
    callback: Callback
  ) => {
    lambdaEventHandler = lambdaEventHandler ?? (await bootstrap());
    return lambdaEventHandler.handleLambdaEvent(event, context, callback);
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

function getCorsConfig(): boolean | CorsOptions {
  const CORS_ORIGINS = process.env['CORS_ORIGINS'];
  const origins = CORS_ORIGINS ? JSON.parse(CORS_ORIGINS) : null;

  if (
    !Array.isArray(origins) ||
    origins.length === 0 ||
    origins.some((it) => typeof it !== 'string')
  ) {
    throw new Error(`Invalid CORS_ORIGINS env var: ${CORS_ORIGINS}`);
  }

  if (!origins) {
    // TODO: This should throw in production envs
    return true;
  }

  return {
    origin: origins,
    credentials: true,
    allowedHeaders: '*',
    methods: '*',
  };
}

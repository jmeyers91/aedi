/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ModuleMetadata,
  NestModule,
  Type,
  applyDecorators,
} from '@nestjs/common';
import { callsites } from '../callsites';
import {
  LambdaMetadata,
  ResourceModule,
  ResourceType,
  getResourceMetadata,
} from './resource-module';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { relative } from 'path';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function LambdaModule(
  metadata: ModuleMetadata,
  { handlerFilePath, ...rest }: Partial<LambdaMetadata> = {}
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
    ResourceModule(
      {
        ...rest,
        type: ResourceType.LAMBDA_FUNCTION,
        id: relativeHandlerFilePath,
        handlerFilePath: relativeHandlerFilePath,
      },
      metadata
    ),
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
    const cors = getCorsConfig();
    console.log(`----- CORS -----`, cors);
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

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException, Error)
export class DevExceptionFilter implements ExceptionFilter {
  catch(error: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    if (error instanceof HttpException) {
      status = error.getStatus();
      message = error.message;
    } else {
      status = (error as any)?.status ?? 500;
      message = error.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
    });
  }
}

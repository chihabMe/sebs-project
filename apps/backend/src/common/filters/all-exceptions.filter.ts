import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: (exception as Error).message, statusCode: status };

    const errorId = Math.random().toString(36).substring(2, 11);

    this.logger.error(
      `Status: ${status} Error: ${JSON.stringify(message)} ErrorID: ${errorId} Path: ${request.url}`,
    );

    response.status(status).json({
      success: false,
      message: typeof message === 'string' ? message : (message as any).message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorId,
      ...(typeof message === 'object' ? message : {}),
    });
  }
}

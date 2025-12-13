import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Catch()
export class ErrorMetricsFilter implements ExceptionFilter {
  constructor(
    @Inject(MetricsService)
    private readonly metricsService: MetricsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorType: string;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorType = exception.name;
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorType = exception.name || 'UnknownError';
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorType = 'UnknownError';
      message = 'An unexpected error occurred';
    }

    // Record the error metric
    this.metricsService.recordHttpError(
      request.method,
      request.url,
      status,
      errorType,
    );

    // Log the error for debugging
    console.error(`[${errorType}] ${request.method} ${request.url}:`, exception);

    // Send the response
    response.status(status).json({
      statusCode: status,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

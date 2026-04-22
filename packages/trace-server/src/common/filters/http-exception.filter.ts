import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || message;
        code = (resp.code as string) || this.getCodeFromStatus(status);
        details = resp.details;
      }
      code = this.getCodeFromStatus(status);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: Record<string, unknown> = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (details !== undefined) {
      errorResponse.error = { ...(errorResponse.error as Record<string, unknown>), details };
    }

    response.status(status).json(errorResponse);
  }

  private getCodeFromStatus(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_ERROR',
    };
    return codeMap[status] || 'ERROR';
  }
}

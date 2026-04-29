import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly statusMessageMap: Record<number, string> = {
    400: '参数校验失败',
    401: '未登录或 Token 失效',
    403: '权限不足',
    404: '资源不存在',
    429: '请求限流',
    500: '服务器内部错误',
  };

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = this.statusMessageMap[500];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = this.statusMessageMap[status] || exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          message = resp.message[0] as string;
        } else {
          message = this.statusMessageMap[status] || (resp.message as string) || message;
        }
      }
    } else if (exception instanceof Error) {
      message = this.statusMessageMap[status] || exception.message;
    }

    const errorResponse = {
      code: status,
      message,
      data: null,
      requestId: randomUUID(),
    };

    response.status(status).json(errorResponse);
  }
}

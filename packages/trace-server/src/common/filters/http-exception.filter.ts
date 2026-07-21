import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly defaultMessages: Record<number, string> = {
    400: '参数校验失败',
    401: '未登录或 Token 失效', // 仅在异常未提供具体消息时使用
    403: '权限不足',
    404: '资源不存在',
    429: '请求限流',
    500: '服务器内部错误',
  };

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = this.defaultMessages[500];
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      // 优先提取异常自带的详细消息
      const detailMessage = this.extractDetailMessage(exceptionResponse);
      if (detailMessage) {
        message = detailMessage;
      } else {
        // 没有具体消息时才使用默认映射
        message = this.defaultMessages[status] || message;
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        details = resp.details;
      }
    } else if (exception instanceof Error) {
      // 非HttpException的异常，开发环境可返回真实错误，生产环境使用500默认消息
      message = this.defaultMessages[500];
      // 可选：记录日志
      console.error('Unhandled exception:', exception);
    }

    const errorResponse: Record<string, unknown> = {
      code: status,
      message,
      data: details === undefined ? null : { details },
      requestId: randomUUID(),
    };

    response.status(status).json(errorResponse);
  }

  private extractDetailMessage(exceptionResponse: string | object): string | null {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(resp.message) && resp.message.length > 0) {
        return String(resp.message[0]);
      }
      if (typeof resp.message === 'string') {
        return resp.message;
      }
      if (typeof resp.error === 'string') {
        return resp.error;
      }
    }
    return null;
  }
}

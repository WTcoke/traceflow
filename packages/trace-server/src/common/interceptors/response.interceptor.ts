import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly successMessageMap: Record<number, string> = {
    200: '业务处理成功',
    201: '资源创建成功',
    202: '请求已接受',
    204: '操作成功，无内容返回',
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode || 200;
        const message = this.successMessageMap[statusCode] || '业务处理成功';

        return {
          code: statusCode,
          message,
          data: data,
          requestId: randomUUID(),
        };
      }),
    );
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    if (this.shouldLogRequest(method, url)) {
      console.log(`[${new Date().toISOString()}] Incoming ${method} ${url}`);
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        console.log(
          `[${new Date().toISOString()}] ${method} ${url} ${response.statusCode} - ${delay}ms`,
        );
      }),
    );
  }

  private shouldLogRequest(method: string, url: string): boolean {
    return method === 'POST' && url.startsWith('/api/v1/collect');
  }
}

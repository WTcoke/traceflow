import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { swaggerConfig, swaggerOptions } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  // 全局日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type,Authorization,X-Requested-With,X-App-Id,X-Timestamp,X-Signature,Content-Encoding',
    exposedHeaders: 'X-Request-Id',
  });

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, swaggerOptions);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[${new Date().toISOString()}] Application is running on: http://localhost:${port}/api`,
  );
  console.log(
    `[${new Date().toISOString()}] Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 安全头
  app.use(helmet());
  // 全局前缀
  app.setGlobalPrefix('api/v1');
  // 参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // 全局异常 & 日志
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  // CORS 跨域
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : '*', // 生产关闭通配符
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type,Authorization,X-Requested-With,X-App-Key,X-Sign,X-SDK-Version,Content-Encoding',
  });

  // Swagger 配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TraceFlow 埋点系统')
    .setDescription('埋点事件采集 API 接口文档')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'TraceFlow API 文档',
  });

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

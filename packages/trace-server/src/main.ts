import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
  });

  // Swagger 配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TraceFlow 埋点系统')
    .setDescription('埋点事件采集 API 接口文档')
    .setVersion('1.0')
    .addTag('track', '埋点事件相关接口')
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

import { DocumentBuilder } from '@nestjs/swagger';

/**
 * Swagger 文档配置
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('TraceFlow 埋点系统')
  .setDescription('埋点事件采集 API 接口文档')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'Bearer',
      bearerFormat: 'JWT',
      description: '请输入 JWT token',
    },
    'Bearer-auth',
  )
  .addTag('collect', '埋点事件相关接口')
  .build();

/**
 * Swagger 文档选项
 */
export const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customSiteTitle: 'TraceFlow API 文档',
};

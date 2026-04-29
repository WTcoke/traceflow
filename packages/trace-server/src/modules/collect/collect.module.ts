import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CollectService } from './collect.service';
import { CollectController } from './collect.controller';
import { CollectMapper } from './collect.mapper';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { json } from 'express';

/**
 * 埋点收集模块
 */
@Module({
  imports: [PrismaModule],
  controllers: [CollectController],
  providers: [CollectService, CollectMapper],
})
export class CollectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 为collect路由使用raw body解析，便于签名验证和gzip解压
    consumer
      .apply(
        json({
          verify: (req, res, buf) => {
            (req as any).rawBody = buf;
          },
        }),
      )
      .forRoutes('collect');
  }
}

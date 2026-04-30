import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { CollectModule } from './modules/collect/collect.module';
import { QueueModule } from './common/queue/queue.module';
import { AiModule } from './modules/ai/ai.module';
import { MonitorModule } from './modules/monitor/monitor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    QueueModule,
    PrismaModule,
    RedisModule,
    CollectModule,
    AiModule,
    MonitorModule,
  ],
})
export class AppModule {}

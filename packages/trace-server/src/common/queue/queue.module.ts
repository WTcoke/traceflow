import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../../core/redis/redis.module';
import { RedisService } from '../../core/redis/redis.service';

@Module({
  imports: [
    RedisModule,
    BullModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      useFactory: (redisService: RedisService) => ({
        connection: redisService.getClient(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [RedisService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

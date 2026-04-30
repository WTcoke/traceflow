import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CollectService } from './collect.service';
import { CollectController } from './collect.controller';
import { CollectMapper } from './collect.mapper';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { CollectConsumer } from './collect.consumer';
import { DataValidatorService } from './data-validator.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.BURIED_POINT,
      streams: { events: { maxLen: 10000 } }, // 限制 Stream 长度
    }),
  ],
  controllers: [CollectController],
  providers: [CollectService, CollectMapper, CollectConsumer, DataValidatorService],
})
export class CollectModule {}

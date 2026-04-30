import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LangChainService } from './providers/langchain.service';
import { AiCacheService } from './providers/ai-cache.service';
import { AiQueueProducer } from './providers/ai-queue.producer';
import { AiQueueConsumer } from './providers/ai-queue.consumer';
import { AI_QUEUE_NAMES } from './constants/ai-queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: AI_QUEUE_NAMES.AI_ANALYSIS,
    }),
  ],
  controllers: [AiController],
  providers: [AiService, LangChainService, AiCacheService, AiQueueProducer, AiQueueConsumer],
  exports: [AiService],
})
export class AiModule {}

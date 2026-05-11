import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AI_QUEUE_NAMES, AiAnalysisJobData } from '../constants/ai-queue.constants';
import { LangChainService } from './langchain.service';
import { AiCacheService } from './ai-cache.service';
import { AiAnalysisResultDto } from '../dto/ai.dto';

@Injectable()
@Processor(AI_QUEUE_NAMES.AI_ANALYSIS)
export class AiQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(AiQueueConsumer.name);

  constructor(
    private prismaService: PrismaService,
    private langChainService: LangChainService,
    private aiCacheService: AiCacheService,
  ) {
    super();
  }

  async process(job: Job<AiAnalysisJobData>): Promise<AiAnalysisResultDto> {
    const { taskId, projectId, analysisType, data, options } = job.data;
    this.logger.log(`Processing AI analysis task: ${taskId}`);

    try {
      const result = await this.langChainService.analyze({
        projectId,
        analysisType,
        data,
        options,
      });

      await this.saveAnalysisResult(result);

      await this.aiCacheService.setCachedResult(taskId, result, 3600);

      this.logger.log(`AI analysis task completed: ${taskId}`);
      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`AI analysis task failed: ${taskId}`, err.stack);
      throw error;
    }
  }

  private async saveAnalysisResult(result: AiAnalysisResultDto): Promise<void> {
    try {
      await this.prismaService.aiAnalysisResult.create({
        data: {
          projectId: result.projectId,
          analysisType: result.analysisType,
          analysisData: result.analysisData as any,
          sqlLog: result.sqlLog || '',
        },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to save analysis result: ${err.message}`);
    }
  }
}

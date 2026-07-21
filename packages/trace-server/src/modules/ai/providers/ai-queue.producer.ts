import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { AI_QUEUE_NAMES, AiAnalysisJobData } from '../constants/ai-queue.constants';
import { AiAnalyzeRequest, AiAnalyzeResponse } from '../interfaces/ai.interfaces';

@Injectable()
export class AiQueueProducer {
  private readonly logger = new Logger(AiQueueProducer.name);

  constructor(@InjectQueue(AI_QUEUE_NAMES.AI_ANALYSIS) private analysisQueue: Queue) {}

  async submitAnalysis(request: AiAnalyzeRequest, userId?: number): Promise<AiAnalyzeResponse> {
    const taskId = uuidv4();

    const jobData: AiAnalysisJobData = {
      taskId,
      projectId: request.projectId,
      analysisType: request.analysisType,
      data: request.data,
      options: request.options,
      userId: userId,
    };

    await this.analysisQueue.add('ai-analysis-task', jobData, {
      jobId: taskId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 86400,
      },
    });

    this.logger.log(`AI analysis task submitted: ${taskId}`);

    return {
      taskId,
    };
  }

  async getTaskStatus(taskId: string): Promise<{ taskId: string; status: string }> {
    const job = await this.analysisQueue.getJob(taskId);

    if (!job) {
      return {
        taskId,
        status: 'not_found',
      };
    }

    const state = await job.getState();

    return {
      taskId,
      status: state,
    };
  }
}

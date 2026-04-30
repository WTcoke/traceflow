import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LangChainService } from './providers/langchain.service';
import { AiCacheService } from './providers/ai-cache.service';
import { AiQueueProducer } from './providers/ai-queue.producer';
import {
  AiQueryRequest,
  AiQueryResponse,
  AiAnalyzeRequest,
  AiAnalyzeResponse,
  AiResultsQueryRequest,
  AiResultsResponse,
} from './interfaces/ai.interfaces';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prismaService: PrismaService,
    private langChainService: LangChainService,
    private aiCacheService: AiCacheService,
    private aiQueueProducer: AiQueueProducer,
  ) {}

  async query(request: AiQueryRequest): Promise<AiQueryResponse> {
    const startTime = Date.now();

    const cached = await this.aiCacheService.getCachedQuery(request.projectId, request.question);
    if (cached) {
      this.logger.debug(`Query cache hit: ${request.question.substring(0, 50)}`);
      return cached as AiQueryResponse;
    }

    try {
      const result = await this.langChainService.queryWithSql(request);

      await this.aiCacheService.setCachedQuery(request.projectId, request.question, result);

      this.logger.log(
        `[AI Query] projectId=${request.projectId} question="${request.question.substring(0, 30)}..." ` +
          `cost=${Date.now() - startTime}ms`,
      );

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`AI query failed: ${err.message}`);
      throw error;
    }
  }

  async submitAnalysis(request: AiAnalyzeRequest): Promise<AiAnalyzeResponse> {
    return this.aiQueueProducer.submitAnalysis(request);
  }

  async getAnalysisResults(request: AiResultsQueryRequest): Promise<AiResultsResponse> {
    const whereClause: any = {
      projectId: request.projectId,
    };

    if (request.analysisType) {
      whereClause.analysisType = request.analysisType;
    }

    const [total, records] = await Promise.all([
      this.prismaService.aiAnalysisResult.count({ where: whereClause }),
      this.prismaService.aiAnalysisResult.findMany({
        where: whereClause,
        orderBy: { createTime: 'desc' },
        skip: (request.pageNum - 1) * request.pageSize,
        take: request.pageSize,
      }),
    ]);

    return {
      total,
      list: records.map((record) => ({
        id: record.id,
        analysisType: record.analysisType,
        analysisData: record.analysisData as Record<string, any>,
        sqlLog: record.sqlLog || undefined,
        createTime: record.createTime.getTime(),
      })),
    };
  }
}

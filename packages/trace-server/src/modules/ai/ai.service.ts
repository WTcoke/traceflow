import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LangChainService } from './providers/langchain.service';
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
    private aiQueueProducer: AiQueueProducer,
  ) {}

  async query(request: AiQueryRequest): Promise<AiQueryResponse> {
    const startTime = Date.now();

    try {
      // 注意：自然语言查询不启用缓存，每次请求都实时生成 SQL 并执行
      const result = await this.langChainService.queryWithSql(request);

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
        id: Number(record.id),
        analysisType: record.analysisType,
        analysisData: record.analysisData as Record<string, any>,
        sqlLog: record.sqlLog || undefined,
        createTime: record.createTime.getTime(),
      })),
    };
  }
}

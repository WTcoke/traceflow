import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { LangChainService } from '../providers/langchain.service';
import { AiQueueProducer } from '../providers/ai-queue.producer';
import { AiCacheService } from '../providers/ai-cache.service';
import {
  AiQueryRequestDto,
  AiQueryResponseDto,
  AiAnalyzeRequestDto,
  AiAnalyzeResponseDto,
  AiResultsQueryRequestDto,
  AiResultsResponseDto,
} from '../dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prismaService: PrismaService,
    private langChainService: LangChainService,
    private aiQueueProducer: AiQueueProducer,
    private aiCacheService: AiCacheService,
  ) {}

  async query(request: AiQueryRequestDto): Promise<AiQueryResponseDto> {
    const startTime = Date.now();

    try {
      // 检查 SQL 缓存（问题→SQL映射）
      const cachedSql = await this.aiCacheService.getCachedSql(request.projectId, request.question);

      let result: AiQueryResponseDto;

      if (cachedSql) {
        // 使用缓存的 SQL 直接执行，避免调用 LLM 生成 SQL
        this.logger.debug(
          `SQL cache hit for projectId=${request.projectId} question="${request.question.substring(0, 30)}..."`,
        );

        try {
          // 执行 SQL 获取最新数据
          const queryResult = await this.langChainService.executeSqlSafely(
            cachedSql,
            request.projectId,
          );

          // 生成自然语言解释
          const explanation = await this.langChainService.generateExplanation(
            cachedSql,
            queryResult,
            request.question,
          );

          result = {
            sql: cachedSql,
            result: queryResult,
            explanation,
          };
        } catch (error) {
          const err = error as Error;
          this.logger.error(`SQL execution failed with cached SQL: ${err.message}`);
          // 缓存的 SQL 可能已失效，重新生成
          result = await this.langChainService.queryWithSql(request);

          // 只缓存成功执行的 SQL
          if (!this.isSqlExecutionFailed(result)) {
            await this.aiCacheService.setCachedSql(request.projectId, request.question, result.sql);
          } else {
            this.logger.debug(`Skipping cache for failed SQL: ${result.sql}`);
          }
        }
      } else {
        // 首次查询，生成 SQL 并执行
        result = await this.langChainService.queryWithSql(request);

        // 只缓存成功执行的 SQL
        if (!this.isSqlExecutionFailed(result)) {
          await this.aiCacheService.setCachedSql(request.projectId, request.question, result.sql);
        } else {
          this.logger.debug(`Skipping cache for failed SQL: ${result.sql}`);
        }
      }

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

  /**
   * 判断 SQL 执行是否失败
   * 通过检查 explanation 是否以错误提示开头
   */
  private isSqlExecutionFailed(response: AiQueryResponseDto): boolean {
    return response.explanation.startsWith('生成的 SQL 可能存在问题，请检查：');
  }

  async submitAnalysis(request: AiAnalyzeRequestDto): Promise<AiAnalyzeResponseDto> {
    return this.aiQueueProducer.submitAnalysis(request);
  }

  async getAnalysisResults(request: AiResultsQueryRequestDto): Promise<AiResultsResponseDto> {
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

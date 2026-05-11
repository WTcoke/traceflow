import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../core/redis/redis.service';
import {
  CACHE_KEYS,
  DEFAULT_CACHE_TTL,
  AiQueryResponseDto,
  AiAnalysisResultDto,
} from '../dto/ai.dto';

@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);

  constructor(private redisService: RedisService) {}

  async getCachedQuery(projectId: number, question: string): Promise<AiQueryResponseDto | null> {
    const cacheKey = this.buildQueryCacheKey(projectId, question);
    try {
      const cached = await this.redisService.getJson<AiQueryResponseDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for query: ${cacheKey}`);
        return cached;
      }
      return null;
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Cache get error: ${err.message}`);
      return null;
    }
  }

  async setCachedQuery(
    projectId: number,
    question: string,
    response: AiQueryResponseDto,
  ): Promise<void> {
    const cacheKey = this.buildQueryCacheKey(projectId, question);
    try {
      await this.redisService.setJson(cacheKey, response, DEFAULT_CACHE_TTL);
      this.logger.debug(`Cached query result: ${cacheKey}`);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Cache set error: ${err.message}`);
    }
  }

  async getCachedResult(taskId: string): Promise<AiAnalysisResultDto | null> {
    const cacheKey = this.buildResultCacheKey(taskId);
    try {
      return await this.redisService.getJson<AiAnalysisResultDto>(cacheKey);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Cache get error: ${err.message}`);
      return null;
    }
  }

  async setCachedResult(
    taskId: string,
    result: AiAnalysisResultDto,
    ttlSeconds: number = DEFAULT_CACHE_TTL,
  ): Promise<void> {
    const cacheKey = this.buildResultCacheKey(taskId);
    try {
      await this.redisService.setJson(cacheKey, result, ttlSeconds);
      this.logger.debug(`Cached result: ${cacheKey}`);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Cache set error: ${err.message}`);
    }
  }

  async invalidateQueryCache(projectId: number, question: string): Promise<void> {
    const cacheKey = this.buildQueryCacheKey(projectId, question);
    try {
      await this.redisService.del(cacheKey);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Cache delete error: ${err.message}`);
    }
  }

  private buildQueryCacheKey(projectId: number, question: string): string {
    const normalizedQuestion = question.trim().toLowerCase().substring(0, 200);
    return this.redisService.generateCacheKey(
      CACHE_KEYS.AI_QUERY,
      projectId.toString(),
      normalizedQuestion,
    );
  }

  private buildSqlCacheKey(projectId: number, question: string): string {
    const normalizedQuestion = question.trim().toLowerCase().substring(0, 200);
    return this.redisService.generateCacheKey(
      CACHE_KEYS.AI_SQL,
      projectId.toString(),
      normalizedQuestion,
    );
  }

  private buildResultCacheKey(taskId: string): string {
    return this.redisService.generateCacheKey(CACHE_KEYS.AI_RESULT, taskId);
  }

  async getCachedSql(projectId: number, question: string): Promise<string | null> {
    const cacheKey = this.buildSqlCacheKey(projectId, question);
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`SQL cache hit for query: ${cacheKey}`);
        return cached;
      }
      return null;
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`SQL cache get error: ${err.message}`);
      return null;
    }
  }

  async setCachedSql(
    projectId: number,
    question: string,
    sql: string,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    const cacheKey = this.buildSqlCacheKey(projectId, question);
    try {
      await this.redisService.set(cacheKey, sql, ttlSeconds);
      this.logger.debug(`Cached SQL: ${cacheKey}`);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`SQL cache set error: ${err.message}`);
    }
  }
}

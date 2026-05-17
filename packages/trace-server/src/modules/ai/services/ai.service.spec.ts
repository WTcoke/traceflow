import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../services/ai.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { LangChainService } from '../providers/langchain.service';
import { AiQueueProducer } from '../providers/ai-queue.producer';
import { AiCacheService } from '../providers/ai-cache.service';

describe('AiService', () => {
  let service: AiService;

  const mockPrismaService = {};
  const mockLangChainService = {
    queryWithSql: jest.fn(),
    executeSqlSafely: jest.fn(),
    generateExplanation: jest.fn(),
  };
  const mockAiQueueProducer = {
    submitAnalysis: jest.fn(),
  };
  const mockAiCacheService = {
    getCachedSql: jest.fn(),
    setCachedSql: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LangChainService, useValue: mockLangChainService },
        { provide: AiQueueProducer, useValue: mockAiQueueProducer },
        { provide: AiCacheService, useValue: mockAiCacheService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('query', () => {
    it('当 SQL 缓存命中时，应该使用缓存的 SQL 执行查询', async () => {
      const cachedSql = 'SELECT COUNT(*) FROM buried_point_data WHERE project_id = 1';
      const queryResult = [{ count: 10 }];
      const explanation = '昨天首页点击量是 10 次';

      mockAiCacheService.getCachedSql.mockResolvedValueOnce(cachedSql);
      mockLangChainService.executeSqlSafely.mockResolvedValueOnce(queryResult);
      mockLangChainService.generateExplanation.mockResolvedValueOnce(explanation);

      const request = { projectId: 1, question: '昨天首页点击量是多少？' };
      const result = await service.query(request);

      expect(mockAiCacheService.getCachedSql).toHaveBeenCalledWith(1, '昨天首页点击量是多少？');
      expect(mockLangChainService.executeSqlSafely).toHaveBeenCalledWith(cachedSql, 1);
      expect(mockLangChainService.generateExplanation).toHaveBeenCalledWith(
        cachedSql,
        queryResult,
        '昨天首页点击量是多少？',
      );
      expect(mockLangChainService.queryWithSql).not.toHaveBeenCalled();
      expect(result).toEqual({ sql: cachedSql, result: queryResult, explanation });
    });

    it('当 SQL 缓存未命中时，应该生成 SQL 并缓存', async () => {
      const mockResult = {
        sql: 'SELECT COUNT(*) FROM buried_point_data WHERE project_id = 1',
        result: [{ count: 10 }],
        explanation: '昨天首页点击量是 10 次',
      };

      mockAiCacheService.getCachedSql.mockResolvedValueOnce(null);
      mockLangChainService.queryWithSql.mockResolvedValueOnce(mockResult);

      const request = { projectId: 1, question: '昨天首页点击量是多少？' };
      const result = await service.query(request);

      expect(mockAiCacheService.getCachedSql).toHaveBeenCalledWith(1, '昨天首页点击量是多少？');
      expect(mockLangChainService.queryWithSql).toHaveBeenCalledWith(request);
      expect(mockAiCacheService.setCachedSql).toHaveBeenCalledWith(
        1,
        '昨天首页点击量是多少？',
        mockResult.sql,
      );
      expect(result).toEqual(mockResult);
    });

    it('当缓存的 SQL 执行失败时，应该重新生成 SQL', async () => {
      const cachedSql = 'INVALID SQL';
      const mockResult = {
        sql: 'SELECT COUNT(*) FROM buried_point_data WHERE project_id = 1',
        result: [{ count: 10 }],
        explanation: '昨天首页点击量是 10 次',
      };

      mockAiCacheService.getCachedSql.mockResolvedValueOnce(cachedSql);
      mockLangChainService.executeSqlSafely.mockRejectedValueOnce(new Error('SQL error'));
      mockLangChainService.queryWithSql.mockResolvedValueOnce(mockResult);

      const request = { projectId: 1, question: '昨天首页点击量是多少？' };
      const result = await service.query(request);

      expect(mockAiCacheService.setCachedSql).toHaveBeenCalledWith(
        1,
        '昨天首页点击量是多少？',
        mockResult.sql,
      );
      expect(result).toEqual(mockResult);
    });

    it('当生成的 SQL 执行失败时，不应该缓存该 SQL', async () => {
      const failedResult = {
        sql: 'INVALID SQL',
        result: [],
        explanation: '生成的 SQL 可能存在问题，请检查：SQL error',
      };

      mockAiCacheService.getCachedSql.mockResolvedValueOnce(null);
      mockLangChainService.queryWithSql.mockResolvedValueOnce(failedResult);

      const request = { projectId: 1, question: '无效问题' };
      const result = await service.query(request);

      expect(mockAiCacheService.setCachedSql).not.toHaveBeenCalled();
      expect(result).toEqual(failedResult);
    });

    it('当缓存 SQL 执行失败且重新生成的 SQL 也失败时，不应缓存任何 SQL', async () => {
      const cachedSql = 'INVALID SQL';
      const failedResult = {
        sql: 'ANOTHER INVALID SQL',
        result: [],
        explanation: '生成的 SQL 可能存在问题，请检查：SQL error',
      };

      mockAiCacheService.getCachedSql.mockResolvedValueOnce(cachedSql);
      mockLangChainService.executeSqlSafely.mockRejectedValueOnce(new Error('SQL error'));
      mockLangChainService.queryWithSql.mockResolvedValueOnce(failedResult);

      const request = { projectId: 1, question: '无效问题' };
      const result = await service.query(request);

      expect(mockAiCacheService.setCachedSql).not.toHaveBeenCalled();
      expect(result).toEqual(failedResult);
    });
  });
});

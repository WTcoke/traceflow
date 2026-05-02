import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LangChainService } from './providers/langchain.service';
import { AiQueueProducer } from './providers/ai-queue.producer';

describe('AiService', () => {
  let service: AiService;

  const mockPrismaService = {};
  const mockLangChainService = {
    queryWithSql: jest.fn(),
  };
  const mockAiQueueProducer = {
    submitAnalysis: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LangChainService, useValue: mockLangChainService },
        { provide: AiQueueProducer, useValue: mockAiQueueProducer },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('query', () => {
    it('应该直接调用 langChainService.queryWithSql 而不使用缓存', async () => {
      const mockResult = {
        sql: 'SELECT * FROM buried_point_data WHERE project_id = 1',
        result: [{ count: 10 }],
        explanation: '昨天首页点击量是 10 次',
      };
      mockLangChainService.queryWithSql.mockResolvedValueOnce(mockResult);

      const request = { projectId: 1, question: '昨天首页点击量是多少？' };
      const result = await service.query(request);

      expect(mockLangChainService.queryWithSql).toHaveBeenCalledWith(request);
      expect(result).toEqual(mockResult);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from '../controllers/ai.controller';
import { AiService } from '../services/ai.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { LangChainService } from '../providers/langchain.service';
import { AiQueueProducer } from '../providers/ai-queue.producer';
import { AiCacheService } from '../providers/ai-cache.service';

describe('AiController', () => {
  let controller: AiController;

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
      controllers: [AiController],
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LangChainService, useValue: mockLangChainService },
        { provide: AiQueueProducer, useValue: mockAiQueueProducer },
        { provide: AiCacheService, useValue: mockAiCacheService },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

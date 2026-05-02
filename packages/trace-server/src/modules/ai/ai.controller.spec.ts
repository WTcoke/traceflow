import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LangChainService } from './providers/langchain.service';
import { AiQueueProducer } from './providers/ai-queue.producer';

describe('AiController', () => {
  let controller: AiController;

  const mockPrismaService = {};
  const mockLangChainService = {
    queryWithSql: jest.fn(),
  };
  const mockAiQueueProducer = {
    submitAnalysis: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LangChainService, useValue: mockLangChainService },
        { provide: AiQueueProducer, useValue: mockAiQueueProducer },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

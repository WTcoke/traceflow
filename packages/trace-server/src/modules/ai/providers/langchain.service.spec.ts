import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LangChainService } from './langchain.service';
import { PrismaService } from '../../../core/prisma/prisma.service';

describe('LangChainService', () => {
  let service: LangChainService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRawUnsafe: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        AI_MODEL_NAME: 'qwen-turbo',
        DASHSCOPE_API_KEY: 'test-api-key',
        DASHSCOPE_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LangChainService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<LangChainService>(LangChainService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeSqlSafely', () => {
    it('应该自动注入 project_id 当 SQL 中没有时', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([{ count: 5 }]);

      // 通过调用 queryWithSql 间接测试 executeSqlSafely
      // 由于 LLM 调用无法 mock，这里直接测试私有方法
      const result = await (service as any).executeSqlSafely(
        'SELECT * FROM buried_point_data WHERE event_time > 0',
        10,
      );

      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalled();
      const calledSql = mockPrismaService.$queryRawUnsafe.mock.calls[0][0];
      expect(calledSql).toContain('project_id = 10');
      expect(calledSql).toContain('LIMIT 100');
    });

    it('不应该重复注入 project_id 当 SQL 中已存在时', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([{ count: 5 }]);

      await (service as any).executeSqlSafely(
        'SELECT * FROM buried_point_data WHERE project_id = 10',
        10,
      );

      const calledSql = mockPrismaService.$queryRawUnsafe.mock.calls[0][0];
      // 只应出现一次 project_id = 10
      const matches = calledSql.match(/project_id\s*=\s*10/g);
      expect(matches?.length).toBe(1);
    });

    it('应该拒绝非白名单表的查询', async () => {
      await expect(
        (service as any).executeSqlSafely('SELECT * FROM user WHERE project_id = 10', 10),
      ).rejects.toThrow('不允许查询表：user');

      expect(mockPrismaService.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('应该拒绝 DELETE 语句', async () => {
      await expect(
        (service as any).executeSqlSafely(
          'DELETE FROM buried_point_data WHERE project_id = 10',
          10,
        ),
      ).rejects.toThrow('只允许 SELECT 查询');
    });

    it('应该拒绝 DROP 语句', async () => {
      await expect(
        (service as any).executeSqlSafely('DROP TABLE buried_point_data', 10),
      ).rejects.toThrow('只允许 SELECT 查询');
    });

    it('应该自动添加 LIMIT 当 SQL 中没有时', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([]);

      await (service as any).executeSqlSafely(
        'SELECT * FROM buried_point_data WHERE project_id = 10',
        10,
      );

      const calledSql = mockPrismaService.$queryRawUnsafe.mock.calls[0][0];
      expect(calledSql).toMatch(/LIMIT\s+100$/i);
    });

    it('不应该重复添加 LIMIT 当 SQL 中已存在时', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([]);

      await (service as any).executeSqlSafely(
        'SELECT * FROM buried_point_data WHERE project_id = 10 LIMIT 50',
        10,
      );

      const calledSql = mockPrismaService.$queryRawUnsafe.mock.calls[0][0];
      const limitMatches = calledSql.match(/LIMIT/gi);
      expect(limitMatches?.length).toBe(1);
    });

    it('应该将 bigint 转换为 number', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([
        { id: BigInt(9007199254740991), count: BigInt(100) },
      ]);

      const result = await (service as any).executeSqlSafely(
        'SELECT * FROM statistics WHERE project_id = 10',
        10,
      );

      expect(typeof result[0].id).toBe('number');
      expect(typeof result[0].count).toBe('number');
      expect(result[0].id).toBe(9007199254740991);
    });
  });
});

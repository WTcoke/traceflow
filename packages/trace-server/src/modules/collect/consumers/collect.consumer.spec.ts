import { Test, TestingModule } from '@nestjs/testing';
import { CollectConsumer } from './collect.consumer';
import { DataValidatorService } from '../services/data-validator.service';
import { CollectMapper } from '../mappers/collect.mapper';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../core/redis/redis.service';

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../common/utils', () => ({
  parseUserAgent: jest.fn().mockReturnValue({
    os: { name: 'Windows' },
    browser: { name: 'Chrome' },
  }),
  parseIP: jest.fn().mockReturnValue({
    country: '中国',
    province: '北京',
    city: '北京',
  }),
}));

describe('CollectConsumer', () => {
  let consumer: CollectConsumer;
  let dataValidatorService: jest.Mocked<DataValidatorService>;
  let collectMapper: jest.Mocked<CollectMapper>;

  beforeEach(async () => {
    dataValidatorService = {
      validateBatch: jest.fn(),
    } as any;

    collectMapper = {
      insertBatch: jest.fn().mockResolvedValue(undefined),
      insertAbnormal: jest.fn().mockResolvedValue(undefined),
      insertAbnormalBatch: jest.fn().mockResolvedValue(undefined),
    } as any;

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue({}),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectConsumer,
        {
          provide: DataValidatorService,
          useValue: dataValidatorService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: CollectMapper,
          useValue: collectMapper,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    consumer = module.get<CollectConsumer>(CollectConsumer);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('processBuriedPoint', () => {
    it('should process valid items successfully', async () => {
      const mockJob = {
        id: 'job_001',
        data: {
          projectId: BigInt(1),
          items: [
            {
              msgId: 'msg_001',
              deviceId: 'device_abc',
              eventTime: Date.now(),
              eventType: 'behavior',
              platform: 'web',
              data: { page: '/home' },
            },
          ],
        },
      };

      dataValidatorService.validateBatch.mockReturnValue({
        valid: true,
        appIdValid: true,
        totalErrors: 0,
        events: [
          {
            index: 0,
            valid: true,
            sanitizedEvent: mockJob.data.items[0],
            errors: [],
          },
        ],
      });

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 1, failed: 0 });
      expect(collectMapper.insertBatch).toHaveBeenCalled();
    });

    it('should handle invalid batch', async () => {
      const mockJob = {
        id: 'job_001',
        data: {
          projectId: BigInt(1),
          items: [
            {
              msgId: 'msg_001',
              deviceId: 'device_abc',
              eventTime: Date.now(),
              eventType: 'behavior',
              platform: 'web',
              data: { page: '/home' },
            },
          ],
        },
      };

      dataValidatorService.validateBatch.mockReturnValue({
        valid: false,
        appIdValid: false,
        totalErrors: 1,
        events: [],
      });

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 0, failed: 0 });
      expect(collectMapper.insertBatch).not.toHaveBeenCalled();
    });

    it('should handle invalid items', async () => {
      const mockJob = {
        id: 'job_001',
        data: {
          projectId: BigInt(1),
          items: [
            {
              msgId: 'msg_001',
              deviceId: 'device_abc',
              eventTime: Date.now(),
              eventType: 'invalid',
              platform: 'web',
              data: { page: '/home' },
            },
          ],
        },
      };

      dataValidatorService.validateBatch.mockReturnValue({
        valid: true,
        appIdValid: true,
        totalErrors: 1,
        events: [
          {
            index: 0,
            valid: false,
            sanitizedEvent: mockJob.data.items[0],
            errors: [{ field: 'eventType', message: 'Invalid eventType' }],
          },
        ],
      });

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 0, failed: 1 });
      expect(collectMapper.insertAbnormalBatch).toHaveBeenCalled();
    });

    it('should handle mixed valid and invalid items', async () => {
      const mockJob = {
        id: 'job_001',
        data: {
          projectId: BigInt(1),
          items: [
            {
              msgId: 'msg_001',
              deviceId: 'device_abc',
              eventTime: Date.now(),
              eventType: 'behavior',
              platform: 'web',
              data: { page: '/home' },
            },
            {
              msgId: 'msg_002',
              deviceId: 'device_xyz',
              eventTime: Date.now(),
              eventType: 'invalid',
              platform: 'web',
              data: { page: '/about' },
            },
          ],
        },
      };

      dataValidatorService.validateBatch.mockReturnValue({
        valid: true,
        appIdValid: true,
        totalErrors: 1,
        events: [
          {
            index: 0,
            valid: true,
            sanitizedEvent: mockJob.data.items[0],
            errors: [],
          },
          {
            index: 1,
            valid: false,
            sanitizedEvent: mockJob.data.items[1],
            errors: [{ field: 'eventType', message: 'Invalid eventType' }],
          },
        ],
      });

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 1, failed: 1 });
      expect(collectMapper.insertBatch).toHaveBeenCalled();
      expect(collectMapper.insertAbnormalBatch).toHaveBeenCalled();
    });

    it('should handle database insert failure with retry', async () => {
      const mockJob = {
        id: 'job_001',
        data: {
          projectId: BigInt(1),
          items: [
            {
              msgId: 'msg_001',
              deviceId: 'device_abc',
              eventTime: Date.now(),
              eventType: 'behavior',
              platform: 'web',
              data: { page: '/home' },
            },
          ],
        },
      };

      dataValidatorService.validateBatch.mockReturnValue({
        valid: true,
        appIdValid: true,
        totalErrors: 0,
        events: [
          {
            index: 0,
            valid: true,
            sanitizedEvent: mockJob.data.items[0],
            errors: [],
          },
        ],
      });

      collectMapper.insertBatch.mockRejectedValue(new Error('Database connection failed'));

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 0, failed: 1 });
      expect(collectMapper.insertBatch).toHaveBeenCalledTimes(3);
      expect(collectMapper.insertAbnormalBatch).toHaveBeenCalled();
    });
  });

  describe('parseDeviceInfo', () => {
    it('should parse device info from data', () => {
      const mockData: any = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip: '202.108.22.5',
      };

      const result = (consumer as any).parseDeviceInfo(mockData as any);

      expect(result.os).toBe('Windows');
      expect(result.browser).toBe('Chrome');
      expect(result.country).toBe('中国');
    });

    it('should handle missing userAgent and ip', () => {
      const mockData: any = {};

      const result = (consumer as any).parseDeviceInfo(mockData as any);

      expect(result.os).toBeUndefined();
      expect(result.browser).toBeUndefined();
      expect(result.country).toBeUndefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', () => {
      const metrics = consumer.getMetrics();
      expect(metrics.processedJobs).toBe(0);
      expect(metrics.succeededJobs).toBe(0);
      expect(metrics.failedJobs).toBe(0);
      expect(metrics.processedItems).toBe(0);
      expect(metrics.succeededItems).toBe(0);
      expect(metrics.failedItems).toBe(0);
    });
  });
});

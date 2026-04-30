import { Test, TestingModule } from '@nestjs/testing';
import { CollectConsumer } from './collect.consumer';
import { DataValidatorService } from './data-validator.service';
import { CollectMapper } from './collect.mapper';
import { Logger } from '@nestjs/common';
import { parseUserAgent, parseIP } from '../../common/utils';

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
      validateAndClean: jest.fn(),
    } as any;

    collectMapper = {
      insertBatch: jest.fn().mockResolvedValue(undefined),
      insertAbnormal: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectConsumer,
        {
          provide: DataValidatorService,
          useValue: dataValidatorService,
        },
        {
          provide: CollectMapper,
          useValue: collectMapper,
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

      dataValidatorService.validateAndClean.mockReturnValue({
        valid: true,
        cleanedData: mockJob.data.items[0],
      });

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 1, failed: 0 });
      expect(collectMapper.insertBatch).toHaveBeenCalled();
    });

    it('should handle invalid items', async () => {
      const mockJob = {
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

      dataValidatorService.validateAndClean.mockReturnValue({
        valid: false,
        errors: ['Invalid eventType'],
      });

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 0, failed: 1 });
      expect(collectMapper.insertAbnormal).toHaveBeenCalled();
    });

    it('should handle mixed valid and invalid items', async () => {
      const mockJob = {
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

      dataValidatorService.validateAndClean
        .mockReturnValueOnce({ valid: true, cleanedData: mockJob.data.items[0] })
        .mockReturnValueOnce({ valid: false, errors: ['Invalid eventType'] });

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 1, failed: 1 });
      expect(collectMapper.insertBatch).toHaveBeenCalled();
      expect(collectMapper.insertAbnormal).toHaveBeenCalled();
    });

    it('should handle database insert failure', async () => {
      const mockJob = {
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

      dataValidatorService.validateAndClean.mockReturnValue({
        valid: true,
        cleanedData: mockJob.data.items[0],
      });

      collectMapper.insertBatch.mockRejectedValue(new Error('Database connection failed'));

      const result = await (consumer as any).processBuriedPoint(mockJob as any);

      expect(result).toEqual({ success: 0, failed: 1 });
      expect(collectMapper.insertAbnormal).toHaveBeenCalled();
    });
  });

  describe('parseDeviceInfo', () => {
    it('should parse device info from data', () => {
      const mockData = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip: '202.108.22.5',
      };

      const result = (consumer as any).parseDeviceInfo(mockData as any);

      expect(result.os).toBe('Windows');
      expect(result.browser).toBe('Chrome');
      expect(result.country).toBe('中国');
    });

    it('should handle missing userAgent and ip', () => {
      const mockData = {};

      const result = (consumer as any).parseDeviceInfo(mockData as any);

      expect(result.os).toBeUndefined();
      expect(result.browser).toBeUndefined();
      expect(result.country).toBeUndefined();
    });
  });
});

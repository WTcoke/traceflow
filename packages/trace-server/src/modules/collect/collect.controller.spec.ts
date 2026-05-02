import { Test, TestingModule } from '@nestjs/testing';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';
import { BadRequestException } from '@nestjs/common';

describe('CollectController', () => {
  let controller: CollectController;
  let collectService: jest.Mocked<CollectService>;

  const mockBuriedPointData = {
    appId: 'test_app_id',
    msgId: 'msg_001',
    deviceId: 'device_abc',
    eventTime: Date.now(),
    eventType: 'behavior' as const,
    platform: 'web' as const,
    data: { page: '/home', action: 'click' },
  };

  beforeEach(async () => {
    collectService = {
      validateAppId: jest.fn().mockResolvedValue({ projectId: BigInt(1) }),
      validateReport: jest.fn().mockResolvedValue(undefined),
      sendToQueue: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectController],
      providers: [
        {
          provide: CollectService,
          useValue: collectService,
        },
      ],
    }).compile();

    controller = module.get<CollectController>(CollectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('collectSingle', () => {
    it('should collect single data successfully', async () => {
      const result = await controller.collectSingle(mockBuriedPointData, {
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any);

      expect(result).toEqual({ received: 1 });
      expect(collectService.validateAppId).toHaveBeenCalledWith('test_app_id');
      expect(collectService.validateReport).toHaveBeenCalledWith(mockBuriedPointData, '127.0.0.1');
      expect(collectService.sendToQueue).toHaveBeenCalledWith(BigInt(1), [mockBuriedPointData]);
    });

    it('should use x-forwarded-for header for client ip', async () => {
      await controller.collectSingle(mockBuriedPointData, {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any);

      expect(collectService.validateReport).toHaveBeenCalledWith(
        mockBuriedPointData,
        '192.168.1.1',
      );
    });
  });

  describe('collectBatch', () => {
    it('should collect batch data successfully', async () => {
      const batchBody = [mockBuriedPointData, mockBuriedPointData];
      const result = await controller.collectBatch(batchBody, {
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any);

      expect(result).toEqual({ received: 2 });
      // 批量只查一次 validateAppId
      expect(collectService.validateAppId).toHaveBeenCalledTimes(1);
      expect(collectService.validateAppId).toHaveBeenCalledWith('test_app_id');
      // validateReport 调用次数 = 批量条数
      expect(collectService.validateReport).toHaveBeenCalledTimes(2);
      expect(collectService.sendToQueue).toHaveBeenCalledWith(BigInt(1), batchBody);
    });

    it('should throw BadRequestException when body is not an array', async () => {
      await expect(
        controller.collectBatch(
          {} as any,
          {
            headers: {},
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' },
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when batch array is empty', async () => {
      await expect(
        controller.collectBatch([], {
          headers: {},
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        } as any),
      ).rejects.toThrow('Batch array cannot be empty');
    });

    it('should throw BadRequestException when batch size exceeds 100', async () => {
      const largeBatch = Array(101).fill(mockBuriedPointData);
      await expect(
        controller.collectBatch(largeBatch, {
          headers: {},
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        } as any),
      ).rejects.toThrow('Batch size must not exceed 100');
    });

    it('should throw error when any item validation fails', async () => {
      collectService.validateReport
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new BadRequestException('Invalid eventType'));

      const batchBody = [mockBuriedPointData, mockBuriedPointData];
      await expect(
        controller.collectBatch(batchBody, {
          headers: {},
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        } as any),
      ).rejects.toThrow('Invalid eventType');
    });

    it('should only call validateAppId once for batch', async () => {
      const batchBody = Array(50).fill(mockBuriedPointData);
      await controller.collectBatch(batchBody, {
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any);

      // 关键断言：无论批量多少条，validateAppId 只调用 1 次
      expect(collectService.validateAppId).toHaveBeenCalledTimes(1);
      expect(collectService.validateReport).toHaveBeenCalledTimes(50);
    });
  });
});

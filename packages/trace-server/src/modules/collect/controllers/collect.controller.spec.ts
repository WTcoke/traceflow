import { Test, TestingModule } from '@nestjs/testing';
import { CollectController } from './collect.controller';
import { CollectService } from '../services/collect.service';
import { BadRequestException } from '@nestjs/common';

describe('CollectController', () => {
  let controller: CollectController;
  let collectService: jest.Mocked<CollectService>;

  const mockBatchEventItem = {
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

  describe('collect', () => {
    it('should collect data successfully', async () => {
      const batchBody = {
        appId: 'test_app_id',
        events: [mockBatchEventItem, mockBatchEventItem],
      };
      const result = await controller.collect(batchBody, {
        headers: { 'content-length': '100' },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any);

      expect(result).toEqual({ received: 2 });
      expect(collectService.validateAppId).toHaveBeenCalledTimes(1);
      expect(collectService.validateAppId).toHaveBeenCalledWith('test_app_id');
      expect(collectService.sendToQueue).toHaveBeenCalledWith(BigInt(1), batchBody.events);
    });

    it('should throw BadRequestException when content length exceeds', async () => {
      const largeBody = {
        appId: 'test_app_id',
        events: Array(100).fill(mockBatchEventItem),
      };
      const oversizedContent = JSON.stringify(largeBody).repeat(1000);

      await expect(
        controller.collect(largeBody, {
          headers: { 'content-length': String(oversizedContent.length) },
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

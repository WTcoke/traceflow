import { Test, TestingModule } from '@nestjs/testing';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';
import { createHmac } from 'crypto';

describe('CollectController', () => {
  let controller: CollectController;
  let collectService: jest.Mocked<CollectService>;

  const mockBuriedPointData = {
    msgId: 'msg_001',
    deviceId: 'device_abc',
    eventTime: Date.now(),
    eventType: 'behavior' as const,
    platform: 'web',
    data: { page: '/home', action: 'click' },
  };

  const mockAppId = 'test_app_id';
  const mockProjectKey = 'test_project_key';

  beforeEach(async () => {
    collectService = {
      verifySignature: jest.fn().mockResolvedValue({ projectId: BigInt(1) }),
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
      const timestamp = Date.now().toString();
      const body = JSON.stringify(mockBuriedPointData);
      const signature = createHmac('sha256', mockProjectKey)
        .update(`${timestamp}${body}`)
        .digest('hex');

      const mockRequest = {
        headers: {},
        rawBody: Buffer.from(body),
      } as any;

      const result = await controller.collectSingle(
        mockAppId,
        timestamp,
        signature,
        mockRequest,
        mockBuriedPointData,
      );

      expect(result).toEqual({ success: true });
      expect(collectService.verifySignature).toHaveBeenCalled();
      expect(collectService.sendToQueue).toHaveBeenCalledWith(BigInt(1), [mockBuriedPointData]);
    });
  });

  describe('collectBatch', () => {
    it('should collect batch data successfully', async () => {
      const batchBody = { list: [mockBuriedPointData, mockBuriedPointData] };
      const timestamp = Date.now().toString();
      const body = JSON.stringify(batchBody);
      const signature = createHmac('sha256', mockProjectKey)
        .update(`${timestamp}${body}`)
        .digest('hex');

      const mockRequest = {
        headers: {},
        rawBody: Buffer.from(body),
      } as any;

      const result = await controller.collectBatch(
        mockAppId,
        timestamp,
        signature,
        mockRequest,
        batchBody,
      );

      expect(result).toEqual({ success: true, count: 2 });
      expect(collectService.verifySignature).toHaveBeenCalled();
      expect(collectService.sendToQueue).toHaveBeenCalledWith(BigInt(1), batchBody.list);
    });
  });
});

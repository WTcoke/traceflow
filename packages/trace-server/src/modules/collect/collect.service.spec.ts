import { Test, TestingModule } from '@nestjs/testing';
import { CollectService } from './collect.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CollectMapper } from './collect.mapper';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';

/**
 * CollectService 单元测试
 */
describe('CollectService', () => {
  let service: CollectService;
  let prismaService: jest.Mocked<PrismaService>;
  let collectMapper: jest.Mocked<CollectMapper>;

  const mockProject = {
    id: BigInt(1),
    appId: 'test_app_id',
    projectKey: 'test_project_key',
    status: 1,
  };

  const mockBuriedPointData = {
    msgId: 'msg_001',
    deviceId: 'device_abc',
    userId: 'user_123',
    eventTime: Date.now(),
    eventType: 'behavior' as const,
    platform: 'web',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ip: '202.108.22.5',
    data: { page: '/home', action: 'click' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CollectMapper,
          useValue: {
            insertSingle: jest.fn(),
            insertBatch: jest.fn(),
            insertAbnormal: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CollectService>(CollectService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    collectMapper = module.get(CollectMapper) as jest.Mocked<CollectMapper>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifySignature', () => {
    it('should verify valid signature successfully', async () => {
      const timestamp = Date.now().toString();
      const body = JSON.stringify(mockBuriedPointData);
      const signature = createHmac('sha256', mockProject.projectKey)
        .update(`${timestamp}${body}`)
        .digest('hex');

      jest.spyOn(prismaService.project, 'findUnique').mockResolvedValue(mockProject as any);

      const result = await service.verifySignature(mockProject.appId, timestamp, signature, body);

      expect(result.projectId).toBe(mockProject.id);
      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { appId: mockProject.appId },
      });
    });

    it('should throw UnauthorizedException for expired timestamp', async () => {
      const expiredTimestamp = (Date.now() - 10 * 60 * 1000).toString();
      const body = '{}';
      const signature = 'some_signature';

      await expect(
        service.verifySignature(mockProject.appId, expiredTimestamp, signature, body),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid appId', async () => {
      const timestamp = Date.now().toString();
      const body = '{}';
      const signature = 'some_signature';

      jest.spyOn(prismaService.project, 'findUnique').mockResolvedValue(null);

      await expect(
        service.verifySignature('invalid_app', timestamp, signature, body),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for disabled project', async () => {
      const timestamp = Date.now().toString();
      const body = '{}';
      const signature = 'some_signature';

      jest.spyOn(prismaService.project, 'findUnique').mockResolvedValue({
        ...mockProject,
        status: 0,
      } as any);

      await expect(
        service.verifySignature(mockProject.appId, timestamp, signature, body),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      const timestamp = Date.now().toString();
      const body = '{}';
      const invalidSignature = 'invalid_signature';

      jest.spyOn(prismaService.project, 'findUnique').mockResolvedValue(mockProject as any);

      await expect(
        service.verifySignature(mockProject.appId, timestamp, invalidSignature, body),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('collectSingle', () => {
    it('should collect single buried point successfully', async () => {
      await service.collectSingle(BigInt(1), mockBuriedPointData);

      expect(collectMapper.insertSingle).toHaveBeenCalled();
    });
  });

  describe('collectBatch', () => {
    it('should collect batch buried points successfully', async () => {
      const batchData = {
        list: [mockBuriedPointData, mockBuriedPointData],
      };

      const result = await service.collectBatch(BigInt(1), batchData);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(collectMapper.insertBatch).toHaveBeenCalled();
    });

    it('should handle partially failed data', async () => {
      const batchData = {
        list: [mockBuriedPointData],
      };

      const spyParseDevice = jest
        .spyOn(service as any, 'parseDeviceInfo')
        .mockImplementation(() => {
          throw new Error('Parse failed');
        });

      const result = await service.collectBatch(BigInt(1), batchData);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(collectMapper.insertAbnormal).toHaveBeenCalled();

      spyParseDevice.mockRestore();
    });
  });

  describe('parseDeviceInfo', () => {
    it('should parse user agent and IP correctly', () => {
      const result = (service as any).parseDeviceInfo(mockBuriedPointData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});

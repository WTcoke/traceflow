import { Test, TestingModule } from '@nestjs/testing';
import { CollectService } from '../services/collect.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';

describe('CollectService', () => {
  let service: CollectService;
  let prismaService: jest.Mocked<PrismaService>;
  let mockQueue: any;

  const mockProject = {
    id: BigInt(1),
    appId: 'test_app_id',
    projectKey: 'test_project_key',
    status: 1,
  };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_123' }),
      addBulk: jest.fn().mockResolvedValue([{ id: 'job_123' }]),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue({
        setnx: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        eval: jest.fn().mockResolvedValue(0),
      }),
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue(true),
    };

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
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.BURIED_POINT),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<CollectService>(CollectService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifySignature', () => {
    it('should verify valid signature successfully', async () => {
      const timestamp = Date.now().toString();
      const body = JSON.stringify({ test: 'data' });
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

  describe('sendToQueue', () => {
    it('should send items to queue', async () => {
      const items = [
        {
          appId: 'test_app_id',
          msgId: 'msg_001',
          deviceId: 'device_abc',
          eventTime: Date.now(),
          eventType: 'behavior' as const,
          platform: 'web',
          data: { page: '/home' },
        },
      ];

      await service.sendToQueue(BigInt(1), items);

      expect(mockQueue.addBulk).toHaveBeenCalled();
    });

    it('should prevent duplicate batch from being queued', async () => {
      const mockRedisClient = {
        setnx: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
        expire: jest.fn().mockResolvedValue(1),
        eval: jest.fn().mockResolvedValue(0),
      };
      const mockRedisService = {
        getClient: jest.fn().mockReturnValue(mockRedisClient),
        getJson: jest.fn().mockResolvedValue(null),
        setJson: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue(true),
      };

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
            provide: RedisService,
            useValue: mockRedisService,
          },
          {
            provide: getQueueToken(QUEUE_NAMES.BURIED_POINT),
            useValue: mockQueue,
          },
        ],
      }).compile();

      const serviceWithRedis = module.get<CollectService>(CollectService);

      const items = [
        {
          appId: 'test_app_id',
          msgId: 'msg_001',
          deviceId: 'device_abc',
          eventTime: Date.now(),
          eventType: 'behavior' as const,
          platform: 'web',
          data: { page: '/home' },
        },
      ];

      await serviceWithRedis.sendToQueue(BigInt(1), items);
      await serviceWithRedis.sendToQueue(BigInt(1), items);

      expect(mockQueue.addBulk).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateAppId', () => {
    it('should validate appId successfully', async () => {
      jest.spyOn(prismaService.project, 'findUnique').mockResolvedValue(mockProject as any);

      const result = await service.validateAppId(mockProject.appId);

      expect(result.projectId).toBe(mockProject.id);
      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { appId: mockProject.appId },
      });
    });

    it('should throw UnauthorizedException for invalid appId', async () => {
      jest.spyOn(prismaService.project, 'findUnique').mockResolvedValue(null);

      await expect(service.validateAppId('invalid_app')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for disabled project', async () => {
      jest.spyOn(prismaService.project, 'findUnique').mockResolvedValue({
        ...mockProject,
        status: 0,
      } as any);

      await expect(service.validateAppId(mockProject.appId)).rejects.toThrow(UnauthorizedException);
    });
  });
});

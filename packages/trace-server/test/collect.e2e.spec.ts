import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';

describe('Collect API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const testAppId = 'test_app_id_' + Date.now();
  const testProjectKey = 'test_project_key_' + Date.now();
  let testProjectId: bigint;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    const project = await prismaService.project.create({
      data: {
        appId: testAppId,
        projectKey: testProjectKey,
        projectName: 'Test Project',
        creatorId: BigInt(1),
      },
    });
    testProjectId = project.id;

    await app.init();
  });

  afterAll(async () => {
    await prismaService.abnormalData.deleteMany({
      where: { projectId: testProjectId },
    });
    await prismaService.project.delete({
      where: { id: testProjectId },
    });
    await app.close();
  });

  describe('POST /collect/single', () => {
    it('should collect single buried point successfully (fast response)', async () => {
      const testData = {
        msgId: 'msg_' + Date.now(),
        deviceId: 'device_' + Date.now(),
        eventTime: Date.now(),
        eventType: 'behavior' as const,
        platform: 'web',
        data: { page: '/home', action: 'click' },
      };

      const timestamp = Date.now().toString();
      const body = JSON.stringify(testData);
      const signature = createHmac('sha256', testProjectKey)
        .update(`${timestamp}${body}`)
        .digest('hex');

      const start = Date.now();
      const response = await request(app.getHttpServer())
        .post('/collect/single')
        .set('X-App-Id', testAppId)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send(testData);
      const duration = Date.now() - start;

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ success: true });
      expect(duration).toBeLessThan(100);
    });

    it('should reject request with invalid signature', async () => {
      const testData = {
        msgId: 'msg_' + Date.now(),
        deviceId: 'device_' + Date.now(),
        eventTime: Date.now(),
        eventType: 'behavior' as const,
        platform: 'web',
        data: { page: '/home' },
      };

      const timestamp = Date.now().toString();
      const invalidSignature = 'invalid_signature';

      const response = await request(app.getHttpServer())
        .post('/collect/single')
        .set('X-App-Id', testAppId)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', invalidSignature)
        .send(testData);

      expect(response.status).toBe(401);
    });

    it('should reject request with expired timestamp', async () => {
      const testData = {
        msgId: 'msg_' + Date.now(),
        deviceId: 'device_' + Date.now(),
        eventTime: Date.now(),
        eventType: 'behavior' as const,
        platform: 'web',
        data: { page: '/home' },
      };

      const expiredTimestamp = (Date.now() - 10 * 60 * 1000).toString();
      const signature = createHmac('sha256', testProjectKey)
        .update(`${expiredTimestamp}${JSON.stringify(testData)}`)
        .digest('hex');

      const response = await request(app.getHttpServer())
        .post('/collect/single')
        .set('X-App-Id', testAppId)
        .set('X-Timestamp', expiredTimestamp)
        .set('X-Signature', signature)
        .send(testData);

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid appId', async () => {
      const testData = {
        msgId: 'msg_' + Date.now(),
        deviceId: 'device_' + Date.now(),
        eventTime: Date.now(),
        eventType: 'behavior' as const,
        platform: 'web',
        data: { page: '/home' },
      };

      const timestamp = Date.now().toString();
      const signature = 'some_signature';

      const response = await request(app.getHttpServer())
        .post('/collect/single')
        .set('X-App-Id', 'invalid_app_id')
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send(testData);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /collect/batch', () => {
    it('should collect batch buried points successfully (fast response)', async () => {
      const batchData = {
        list: [
          {
            msgId: 'msg_batch_1_' + Date.now(),
            deviceId: 'device_batch_1',
            eventTime: Date.now(),
            eventType: 'behavior' as const,
            platform: 'web',
            data: { page: '/home', action: 'click' },
          },
          {
            msgId: 'msg_batch_2_' + Date.now(),
            deviceId: 'device_batch_2',
            eventTime: Date.now(),
            eventType: 'performance' as const,
            platform: 'web',
            data: { pageLoadTime: 1500 },
          },
        ],
      };

      const timestamp = Date.now().toString();
      const body = JSON.stringify(batchData);
      const signature = createHmac('sha256', testProjectKey)
        .update(`${timestamp}${body}`)
        .digest('hex');

      const start = Date.now();
      const response = await request(app.getHttpServer())
        .post('/collect/batch')
        .set('X-App-Id', testAppId)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send(batchData);
      const duration = Date.now() - start;

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests with fast response', async () => {
      const requests: Promise<any>[] = [];
      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        const testData = {
          msgId: 'msg_concurrent_' + i + '_' + Date.now(),
          deviceId: 'device_concurrent_' + i,
          eventTime: Date.now(),
          eventType: 'behavior' as const,
          platform: 'web',
          data: { index: i },
        };

        const timestamp = Date.now().toString();
        const body = JSON.stringify(testData);
        const signature = createHmac('sha256', testProjectKey)
          .update(`${timestamp}${body}`)
          .digest('hex');

        requests.push(
          request(app.getHttpServer())
            .post('/collect/single')
            .set('X-App-Id', testAppId)
            .set('X-Timestamp', timestamp)
            .set('X-Signature', signature)
            .send(testData),
        );
      }

      const responses = await Promise.all(requests);
      const totalDuration = Date.now() - start;
      const successCount = responses.filter((r) => r.status === 201).length;

      expect(successCount).toBe(10);
      expect(totalDuration).toBeLessThan(500);
    });
  });
});

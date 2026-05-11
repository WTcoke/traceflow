import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { BuriedPointEventDto } from '../dto/buried-point.dto';
import { createHash, createHmac } from 'node:crypto';

interface CachedAppIdInfo {
  projectId: string;
  status: number;
}

@Injectable()
export class CollectService {
  private readonly logger = new Logger(CollectService.name);

  private readonly APPID_CACHE_TTL = 300;
  private readonly APPID_CACHE_PREFIX = 'cache:appid';
  private readonly SIGNATURE_EXPIRE_WINDOW = 5 * 60 * 1000;
  private readonly BATCH_QUEUE_TTL = 300;
  private redisEnabled = true;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @InjectQueue(QUEUE_NAMES.BURIED_POINT)
    private readonly buriedPointQueue: Queue,
  ) {
    this.checkRedisHealth().catch(() => {
      this.redisEnabled = false;
      this.logger.warn('Redis health check failed, running in degraded mode');
    });
  }

  private async checkRedisHealth(): Promise<void> {
    const isHealthy = await this.redis.ping();
    if (!isHealthy) {
      throw new Error('Redis connection failed');
    }
  }

  private async getCachedAppId(appId: string): Promise<CachedAppIdInfo | null> {
    if (!this.redisEnabled) return null;
    const cacheKey = `${this.APPID_CACHE_PREFIX}:${appId}`;
    try {
      return await this.redis.getJson<CachedAppIdInfo>(cacheKey);
    } catch (error) {
      this.logger.error(`Failed to get cached appId: ${(error as Error).message}`);
      return null;
    }
  }

  private async setCachedAppId(appId: string, info: CachedAppIdInfo): Promise<void> {
    if (!this.redisEnabled) return;
    const cacheKey = `${this.APPID_CACHE_PREFIX}:${appId}`;
    try {
      await this.redis.setJson(cacheKey, info, this.APPID_CACHE_TTL);
    } catch (error) {
      this.logger.error(`Failed to set cached appId: ${(error as Error).message}`);
    }
  }

  async validateAppId(appId: string): Promise<{ projectId: bigint }> {
    const cached = await this.getCachedAppId(appId);
    if (cached) {
      if (cached.status !== 1) {
        throw new UnauthorizedException('Project is disabled');
      }
      return { projectId: BigInt(cached.projectId) };
    }

    const project = await this.prisma.project.findUnique({ where: { appId } });
    if (!project) {
      this.logger.warn(`Invalid appId: ${appId}`);
      throw new UnauthorizedException('Invalid appId');
    }
    if (project.status !== 1) {
      this.logger.warn(`Project disabled: ${appId}`);
      throw new UnauthorizedException('Project is disabled');
    }

    await this.setCachedAppId(appId, { projectId: project.id.toString(), status: project.status });
    return { projectId: project.id };
  }

  async verifySignature(
    appId: string,
    timestamp: string,
    signature: string,
    body: string,
  ): Promise<{ projectId: bigint }> {
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);

    if (Math.abs(now - requestTime) > this.SIGNATURE_EXPIRE_WINDOW) {
      throw new UnauthorizedException('Signature expired');
    }

    const project = await this.validateAppId(appId);
    const expectedSignature = createHmac('sha256', project.projectId.toString())
      .update(`${timestamp}${body}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new UnauthorizedException('Invalid signature');
    }
    return { projectId: project.projectId };
  }

  private async isBatchAlreadyQueued(
    projectId: bigint,
    items: BuriedPointEventDto[],
  ): Promise<boolean> {
    if (!this.redisEnabled) return false;

    const batchKey = this.generateRedisBatchKey(projectId, items);
    const client = this.redis.getClient();

    try {
      const result = await client.eval(
        `
        if redis.call('SETNX', KEYS[1], ARGV[1]) == 1 then
          redis.call('EXPIRE', KEYS[1], ARGV[2])
          return 1
        else
          return 0
        end
        `,
        1,
        batchKey,
        '1',
        this.BATCH_QUEUE_TTL,
      );
      return result === 0;
    } catch (error) {
      this.logger.error(`Redis error during batch deduplication: ${(error as Error).message}`);
      return false;
    }
  }

  // ====================== 优化核心：抽象公共哈希方法 ======================
  /**
   * 生成批次唯一哈希值（提取重复逻辑）
   */
  private generateBatchHash(items: BuriedPointEventDto[]): string {
    const msgIds = items
      .map((item) => item.msgId)
      .sort()
      .join('-');
    return createHash('md5').update(msgIds).digest('hex');
  }

  /**
   * 生成Redis去重键（仅保留格式拼接）
   */
  private generateRedisBatchKey(projectId: bigint, items: BuriedPointEventDto[]): string {
    const hash = this.generateBatchHash(items);
    return `queue:batch:${projectId}:${hash}`;
  }

  /**
   * 生成队列JobID（仅保留格式拼接）
   */
  private generateJobId(projectId: bigint, items: BuriedPointEventDto[]): string {
    const hash = this.generateBatchHash(items);
    return `queue_batch_${projectId}_${hash}`;
  }
  // ======================================================================

  async sendToQueue(projectId: bigint, items: BuriedPointEventDto[]): Promise<void> {
    if (items.length === 0) return;

    const chunks = this.chunkArray(items, 100);
    const jobs = [];
    const duplicateChecks = [];

    for (const chunk of chunks) {
      if (this.redisEnabled) {
        duplicateChecks.push(
          this.isBatchAlreadyQueued(projectId, chunk).then((isDuplicate) => ({
            chunk,
            isDuplicate,
          })),
        );
      } else {
        jobs.push(this.createJob(projectId, chunk));
      }
    }

    if (duplicateChecks.length > 0) {
      const results = await Promise.all(duplicateChecks);
      for (const { chunk, isDuplicate } of results) {
        if (!isDuplicate) jobs.push(this.createJob(projectId, chunk));
      }
    }

    if (jobs.length === 0) return;

    try {
      await this.buriedPointQueue.addBulk(jobs);
    } catch (error) {
      this.logger.error(`Failed to send items to queue: ${(error as Error).message}`);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private createJob(projectId: bigint, chunk: BuriedPointEventDto[]) {
    return {
      name: QUEUE_NAMES.BURIED_POINT,
      data: {
        projectId: String(projectId),
        items: chunk,
      },
      opts: {
        jobId: this.generateJobId(projectId, chunk),
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
}

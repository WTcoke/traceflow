import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { DataValidatorService, CleanedBuriedPointData } from './data-validator.service';
import { CollectMapper } from './collect.mapper';
import { SingleBuriedPointDto } from './dto/buried-point.dto';
import { parseUserAgent, parseIP } from '../../common/utils';

@Injectable()
export class CollectConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollectConsumer.name);
  private worker: Worker | null = null;

  constructor(
    private readonly dataValidator: DataValidatorService,
    private readonly collectMapper: CollectMapper,
  ) {}

  async onModuleInit() {
    this.worker = new Worker(
      QUEUE_NAMES.BURIED_POINT,
      async (job: Job) => {
        return this.processBuriedPoint(job);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        concurrency: 4,
        maxStalledCount: 3,
      },
    );

    this.worker.on('error', (error) => {
      this.logger.error(`Worker error: ${error.message}`, error.stack);
    });

    this.worker.on('failed', (job, error) => {
      const jobId = job ? (typeof job === 'object' ? job.id : job) : 'unknown';
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
    });

    this.worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed successfully`);
    });

    this.worker.on('stalled', (jobId) => {
      this.logger.warn(`Job ${jobId} stalled`);
    });

    this.logger.log('Buried point consumer worker started');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Buried point consumer worker stopped');
    }
  }

  private async processBuriedPoint(job: Job) {
    const { projectId, items } = job.data as {
      projectId: bigint;
      items: Array<Record<string, any>>;
    };

    this.logger.debug(`Processing ${items.length} items for project ${projectId}`);

    const validItems: Array<{ data: SingleBuriedPointDto; parsed?: any }> = [];
    const invalidItems: Array<{ originalData: string; errorReason: string }> = [];

    for (const item of items) {
      const result = this.dataValidator.validateAndClean(item);

      if (!result.valid) {
        invalidItems.push({
          originalData: JSON.stringify(item),
          errorReason: result.errors?.join('; ') || 'Validation failed',
        });
        continue;
      }

      const cleanedData = result.cleanedData! as unknown as SingleBuriedPointDto;
      const parsed = this.parseDeviceInfo(result.cleanedData! as CleanedBuriedPointData);

      validItems.push({
        data: cleanedData,
        parsed,
      });
    }

    if (validItems.length > 0) {
      try {
        await this.collectMapper.insertBatch(projectId, validItems);
        this.logger.debug(`Inserted ${validItems.length} valid items`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to insert valid items: ${errorMsg}`);
        invalidItems.push(
          ...validItems.map((item) => ({
            originalData: JSON.stringify(item.data),
            errorReason: 'Database insert failed: ' + errorMsg,
          })),
        );
        validItems.length = 0;
      }
    }

    if (invalidItems.length > 0) {
      for (const invalid of invalidItems) {
        try {
          await this.collectMapper.insertAbnormal(
            projectId,
            invalid.originalData,
            invalid.errorReason,
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to insert abnormal data: ${errorMsg}`);
        }
      }
      this.logger.debug(`Inserted ${invalidItems.length} abnormal items`);
    }

    return {
      success: validItems.length,
      failed: invalidItems.length,
    };
  }

  private parseDeviceInfo(data: CleanedBuriedPointData) {
    const parsed: {
      os?: string;
      browser?: string;
      country?: string;
      province?: string;
      city?: string;
    } = {};

    if (data.userAgent) {
      const uaInfo = parseUserAgent(data.userAgent);
      parsed.os = uaInfo.os.name || '';
      parsed.browser = uaInfo.browser.name || '';
    }

    if (data.ip) {
      const ipInfo = parseIP(data.ip);
      if (ipInfo) {
        parsed.country = ipInfo.country;
        parsed.province = ipInfo.province;
        parsed.city = ipInfo.city;
      }
    }

    return parsed;
  }
}

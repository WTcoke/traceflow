import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { DataValidatorService } from './data-validator.service';
import { CollectMapper } from './collect.mapper';
import { CleanedBuriedPointData } from './dto/buried-point.dto';
import { parseUserAgent, parseIP } from '../../common/utils';
import { RedisService } from '../../core/redis/redis.service';

// ==================== 接口定义 ====================

/**
 * 处理结果接口
 * 用于记录一次任务处理中成功和失败的数据条数
 */
interface ProcessResult {
  success: number; // 成功处理的数据条数
  failed: number; // 失败的数据条数
}

/**
 * 验证通过的数据项接口
 * 包含清洗后的埋点数据和解析出的设备信息
 */
interface ValidatedItem {
  data: CleanedBuriedPointData; // 清洗后的埋点数据
}

/**
 * 无效数据项接口
 * 用于记录验证失败的数据，方便后续排查问题
 */
interface InvalidItem {
  msgId: string; // 消息 ID，用于追踪
  errorReason: string; // 失败原因描述
}

// ==================== CollectConsumer 消费服务类 ====================

/**
 * 埋点数据消费服务
 *
 * 核心功能：
 * 1. 从消息队列（Redis + BullMQ）中获取埋点数据任务
 * 2. 对每条埋点数据进行校验和清洗
 * 3. 解析设备信息（UserAgent 解析操作系统和浏览器，IP 解析地理位置）
 * 4. 将有效数据批量写入数据库
 * 5. 将无效数据（验证失败的）记录到异常表，方便后续排查
 *
 * 工作流程：
 * 收到 Job → 校验格式 → 遍历每条数据验证清洗 → 解析设备信息 → 批量入库 → 返回处理结果
 */
@Injectable()
export class CollectConsumer implements OnModuleInit, OnModuleDestroy {
  // Worker 实例，用于处理队列中的任务（类似消费者线程）
  private worker: Worker | null = null;

  // 并发处理数量，同时最多处理 50 个任务
  private concurrency = 50;

  // 内部指标统计，用于监控处理性能
  private metrics = {
    processedJobs: 0, // 已处理的任务总数
    succeededJobs: 0, // 成功的任务数
    failedJobs: 0, // 失败的任务数
    processedItems: 0, // 已处理的数据项总数
    succeededItems: 0, // 成功的数据项数
    failedItems: 0, // 失败的数据项数
    avgProcessingTime: 0, // 平均处理时间（毫秒）
    totalProcessingTime: 0, // 总处理时间（毫秒）
  };

  constructor(
    private readonly dataValidator: DataValidatorService,
    private readonly redisService: RedisService,
    private readonly collectMapper: CollectMapper,
  ) {}

  async onModuleInit() {
    Logger.log(`启动埋点数据消费服务`);

    this.worker = new Worker(
      QUEUE_NAMES.BURIED_POINT,
      async (job: Job) => {
        return this.processBuriedPoint(job);
      },
      {
        connection: this.redisService.getClient(),
        concurrency: this.concurrency,
        maxStalledCount: 3,
      },
    );

    // 监听 Worker 的各种事件

    // ready 事件：Worker 准备就绪，可以开始处理任务
    this.worker.on('ready', () => {
      Logger.log(`BuriedPoint Worker 已准备就绪，开始监听队列: ${QUEUE_NAMES.BURIED_POINT}`);
    });

    // error 事件：Worker 发生错误（比如 Redis 连接失败）
    this.worker.on('error', (error) => {
      Logger.error(`BuriedPoint Worker 错误: ${error.message}`, error.stack);
    });

    // failed 事件：任务执行失败
    this.worker.on('failed', (job, error) => {
      this.metrics.failedJobs++; // 失败任务计数 +1
    });

    // completed 事件：任务执行成功
    this.worker.on('completed', (job) => {
      this.metrics.succeededJobs++; // 成功任务计数 +1
    });

    // stalled - 应该加上日志，方便排查哪些 Job 卡顿过
    this.worker.on('stalled', (jobId) => {
      Logger.warn(`埋点任务卡顿，Job ID: ${jobId}，将被自动重试`);
    });

    // failed - 可以加更详细的日志，记录失败原因
    this.worker.on('failed', (job, error) => {
      this.metrics.failedJobs++;
      Logger.error(`埋点任务失败，Job ID: ${job?.id}，原因: ${error.message}`);
    });
  }

  /**
   * 模块销毁时执行，关闭 Worker 释放资源
   * 优雅关闭 Redis 连接和 Worker 实例，防止资源泄漏
   */
  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  /**
   * 处理单个埋点数据Job的核心方法
   * 1. 校验Job数据格式
   * 2. 遍历数据项进行校验和清洗
   * 3. 解析设备信息（UserAgent、IP）
   * 4. 批量插入有效数据和异常数据到数据库
   * 5. 更新处理指标
   * @param job - BullMQ Job对象
   * @returns 处理结果，包含成功和失败的数量
   */
  private async processBuriedPoint(job: Job): Promise<ProcessResult> {
    const startTime = Date.now();
    Logger.log(
      `开始处理埋点数据 Job，Job ID: ${job.id}, 数据量: ${(job.data as Record<string, any>)?.items?.length || 0}`,
    );

    const validationResult = this.dataValidator.validateBatch({
      appId: String(job.data?.projectId),
      events: job.data?.items,
    });

    if (!validationResult.appIdValid) {
      Logger.warn(`Job 数据格式无效（appId无效），Job ID: ${job.id}`);
      return { success: 0, failed: 0 };
    }

    const projectIdBigInt =
      typeof job.data.projectId === 'string' ? BigInt(job.data.projectId) : job.data.projectId;

    const validItems: ValidatedItem[] = [];
    const invalidItems: InvalidItem[] = [];

    for (const eventResult of validationResult.events) {
      if (eventResult.valid) {
        this.parseDeviceInfo(eventResult.sanitizedEvent);
        validItems.push({
          data: eventResult.sanitizedEvent,
        });
      } else {
        invalidItems.push({
          msgId: eventResult.sanitizedEvent.msgId || 'unknown',
          errorReason: eventResult.errors.map((e) => `${e.field}: ${e.message}`).join('; '),
        });
      }
    }

    if (validItems.length > 0) {
      Logger.log(`执行 insertBatch，projectId: ${projectIdBigInt}, 数据量: ${validItems.length}`);
      const maxRetries = 3;
      let retryCount = 0;
      let insertSuccess = false;

      while (retryCount < maxRetries && !insertSuccess) {
        try {
          await this.collectMapper.insertBatch(
            projectIdBigInt,
            validItems.map((item) => item.data),
          );
          insertSuccess = true;
          Logger.log(
            `insertBatch 执行完成，projectId: ${projectIdBigInt}, 成功插入: ${validItems.length} 条`,
          );
        } catch (error) {
          retryCount++;
          Logger.warn(
            `insertBatch 失败，第 ${retryCount} 次重试，projectId: ${projectIdBigInt}, 错误: ${(error as Error).message}`,
          );
          if (retryCount >= maxRetries) {
            Logger.error(
              `insertBatch 重试 ${maxRetries} 次仍失败，将数据标记为异常，projectId: ${projectIdBigInt}`,
            );
            invalidItems.push(
              ...validItems.map((item) => ({
                msgId: item.data.msgId || 'unknown',
                errorReason: `数据库插入失败: ${(error as Error).message}`,
              })),
            );
            validItems.length = 0;
          }
        }
      }
    }

    if (invalidItems.length > 0) {
      Logger.log(
        `执行 insertAbnormalBatch，projectId: ${projectIdBigInt}, 异常数据量: ${invalidItems.length}`,
      );
      await this.collectMapper.insertAbnormalBatch(projectIdBigInt, invalidItems);
      Logger.log(
        `insertAbnormalBatch 执行完成，projectId: ${projectIdBigInt}, 成功插入: ${invalidItems.length} 条`,
      );
    }

    const processingTime = Date.now() - startTime;
    this.updateMetrics(
      validationResult.events.length,
      validItems.length,
      invalidItems.length,
      processingTime,
    );

    Logger.log(
      `Job 处理完成，Job ID: ${job.id}, 总数据量: ${validationResult.events.length}, 成功: ${validItems.length}, 失败: ${invalidItems.length}, 耗时: ${processingTime}ms`,
    );

    return {
      success: validItems.length,
      failed: invalidItems.length,
    };
  }

  /**
   * 解析设备信息
   * 从UserAgent解析操作系统和浏览器，从IP解析地理位置（国家、省份、城市）
   * @param data - 清洗后的埋点数据
   * @returns 包含设备信息的对象
   */
  private parseDeviceInfo(data: CleanedBuriedPointData): CleanedBuriedPointData {
    if (data.userAgent) {
      const uaInfo = parseUserAgent(data.userAgent);
      data.os = uaInfo.os.name || data.os; // 优先使用解析结果，保留原值作为 fallback
      data.browser = uaInfo.browser.name || data.browser;
    }

    if (data.ip) {
      const ipInfo = parseIP(data.ip);
      if (ipInfo) {
        data.country = ipInfo.country || data.country;
        data.province = ipInfo.province || data.province;
        data.city = ipInfo.city || data.city;
      }
    }

    return data;
  }

  /**
   * 更新处理指标统计
   * @param totalProcessed - 处理的总数据项数
   * @param succeeded - 成功处理的数据项数
   * @param failed - 失败的数据项数
   * @param processingTime - 本次处理耗时（毫秒）
   */
  private updateMetrics(
    totalProcessed: number,
    succeeded: number,
    failed: number,
    processingTime: number,
  ): void {
    this.metrics.processedJobs++;
    this.metrics.processedItems += totalProcessed;
    this.metrics.succeededItems += succeeded;
    this.metrics.failedItems += failed;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.avgProcessingTime = this.metrics.totalProcessingTime / this.metrics.processedJobs;
  }

  /**
   * 获取当前处理指标统计
   * 返回指标的浅拷贝，防止外部修改内部状态
   * @returns 指标对象副本
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
}

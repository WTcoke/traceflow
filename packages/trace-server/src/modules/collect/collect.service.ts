import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { SingleBuriedPointDto } from './dto/buried-point.dto';

@Injectable()
export class CollectService {
  // 限流阈值
  private readonly IP_RATE_LIMIT = 60;
  private readonly DEVICE_RATE_LIMIT = 20;
  private readonly RATE_LIMIT_WINDOW = 60;

  private readonly MSGID_DEDUP_TTL = 24 * 60 * 60;

  private readonly VALID_PLATFORMS = ['web', 'ios', 'android', 'miniapp', 'pc', 'h5'];
  private readonly VALID_EVENT_TYPES = ['behavior', 'performance', 'error'];

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @InjectQueue(QUEUE_NAMES.BURIED_POINT)
    private readonly buriedPointQueue: Queue,
  ) {}

  /**
   * 平台别名归一化
   */
  private normalizePlatform(platform: string): string {
    if (!platform) return 'h5';
    const key = platform.toLowerCase().trim();

    const aliasMap: Record<string, string> = {
      mini: 'miniapp',
      wx: 'miniapp',
      wechat: 'miniapp',
      miniapp: 'miniapp',
      web: 'web',
      ios: 'ios',
      android: 'android',
      pc: 'pc',
      h5: 'h5',
    };

    return aliasMap[key] || 'h5';
  }

  /**
   * 事件类型归一化（支持 click / pv / visit 等）
   */
  private normalizeEventType(eventType: string): string {
    if (!eventType) return 'behavior';
    const key = eventType.toLowerCase().trim();

    const aliasMap: Record<string, string> = {
      // 行为类型
      click: 'behavior',
      pv: 'behavior',
      pageview: 'behavior',
      visit: 'behavior',
      view: 'behavior',
      action: 'behavior',
      behavior: 'behavior',

      // 性能类型
      performance: 'performance',
      load: 'performance',
      speed: 'performance',

      // 错误类型
      error: 'error',
      err: 'error',
      exception: 'error',
      crash: 'error',
    };

    return aliasMap[key] || 'behavior';
  }

  /**
   * 校验 appId 对应的 project，只查一次数据库
   */
  async validateAppId(appId: string): Promise<{ projectId: bigint }> {
    const project = await this.prisma.project.findUnique({
      where: { appId },
    });
    if (!project) throw new UnauthorizedException('Invalid appId');
    if (project.status !== 1) throw new UnauthorizedException('Project is disabled');
    return { projectId: project.id };
  }

  /**
   * 单条数据的基础校验（字段、归一化、msgId 去重、限流）
   * 不包含 appId 的 project 查询
   */
  async validateReport(data: SingleBuriedPointDto, clientIp: string): Promise<void> {
    if (!data) throw new BadRequestException('Data cannot be empty');
    // 1. 必填校验
    const requiredFields = ['appId', 'msgId', 'deviceId', 'eventTime', 'eventType', 'platform'];
    const missing = requiredFields.filter((f) => {
      const v = (data as any)[f];
      return v === undefined || v === null || v === '';
    });
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required fields: ${missing.join(', ')}`);
    }

    // 2. 自动归一化事件类型（不再直接报错）
    data.eventType = this.normalizeEventType(data.eventType);

    // 3. 自动归一化平台
    data.platform = this.normalizePlatform(data.platform);

    // 最终兜底校验（几乎不会触发）
    if (!this.VALID_EVENT_TYPES.includes(data.eventType)) {
      data.eventType = 'behavior';
    }
    if (!this.VALID_PLATFORMS.includes(data.platform)) {
      data.platform = 'h5';
    }

    // 4. msgId 去重
    const msgIdKey = `dedup:msgId:${data.msgId}`;
    const exists = await this.redis.exists(msgIdKey);
    if (exists) throw new ConflictException(`Duplicate msgId: ${data.msgId}`);
    await this.redis.set(msgIdKey, '1', this.MSGID_DEDUP_TTL);

    // 5. 限流
    await this.checkRateLimit(`rate:ip:${clientIp}`, this.IP_RATE_LIMIT);
    await this.checkRateLimit(`rate:device:${data.deviceId}`, this.DEVICE_RATE_LIMIT);
  }

  private async checkRateLimit(key: string, maxRequests: number): Promise<void> {
    const current = await this.redis.get(key);
    const count = current ? parseInt(current, 10) : 0;
    if (count >= maxRequests) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    const client = this.redis.getClient();
    const pipeline = client.pipeline();
    pipeline.incr(key);
    if (count === 0) pipeline.expire(key, this.RATE_LIMIT_WINDOW);
    await pipeline.exec();
  }

  async sendToQueue(projectId: bigint, items: SingleBuriedPointDto[]): Promise<void> {
    await this.buriedPointQueue.add('buried_point', {
      projectId: String(projectId),
      items,
    });
  }
}

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CollectMapper } from './collect.mapper';
import { SingleBuriedPointDto, BatchBuriedPointDto } from './dto/buried-point.dto';
import { parseUserAgent, parseIP } from '../../common/utils';

/**
 * 埋点收集服务
 */
@Injectable()
export class CollectService {
  constructor(
    private prisma: PrismaService,
    private collectMapper: CollectMapper,
  ) {}

  /**
   * 验证请求签名
   */
  async verifySignature(
    appId: string,
    timestamp: string,
    signature: string,
    body: string,
  ): Promise<{ projectId: bigint }> {
    // 验证时间戳（5分钟内有效）
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Invalid or expired timestamp');
    }

    // 查询项目信息获取projectKey
    const project = await this.prisma.project.findUnique({
      where: { appId },
    });

    if (!project) {
      throw new UnauthorizedException('Invalid appId');
    }

    if (project.status !== 1) {
      throw new UnauthorizedException('Project is disabled');
    }

    // 计算签名
    const expectedSignature = this.generateSignature(project.projectKey, timestamp, body);

    if (expectedSignature !== signature) {
      throw new UnauthorizedException('Invalid signature');
    }

    return { projectId: project.id };
  }

  /**
   * 生成HMAC-SHA256签名
   */
  private generateSignature(projectKey: string, timestamp: string, body: string): string {
    const payload = `${timestamp}${body}`;
    return createHmac('sha256', projectKey).update(payload).digest('hex');
  }

  /**
   * 解析用户代理和IP信息
   */
  parseDeviceInfo(data: SingleBuriedPointDto) {
    const parsed: {
      os?: string;
      browser?: string;
      country?: string;
      province?: string;
      city?: string;
    } = {};

    // 解析UA
    if (data.userAgent) {
      const uaInfo = parseUserAgent(data.userAgent);
      parsed.os = uaInfo.os.name || '';
      parsed.browser = uaInfo.browser.name || '';
    }

    // 解析IP
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

  /**
   * 单条埋点数据上报
   */
  async collectSingle(projectId: bigint, data: SingleBuriedPointDto): Promise<void> {
    // 解析设备信息
    const parsed = this.parseDeviceInfo(data);

    // 插入数据
    await this.collectMapper.insertSingle(projectId, data, parsed);
  }

  /**
   * 批量埋点数据上报
   */
  async collectBatch(
    projectId: bigint,
    batchData: BatchBuriedPointDto,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    const failedList: Array<{ data: SingleBuriedPointDto; error: string }> = [];

    // 预处理数据
    const items = batchData.list
      .map((item) => {
        try {
          const parsed = this.parseDeviceInfo(item);
          success++;
          return { data: item, parsed };
        } catch (error) {
          failedList.push({
            data: item,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return null;
        }
      })
      .filter(Boolean) as Array<{ data: SingleBuriedPointDto; parsed?: any }>;

    // 批量插入成功的数据
    if (items.length > 0) {
      await this.collectMapper.insertBatch(projectId, items);
    }

    // 记录异常数据
    for (const failed of failedList) {
      try {
        await this.collectMapper.insertAbnormal(
          projectId,
          JSON.stringify(failed.data),
          failed.error,
        );
      } catch {
        // 忽略记录异常数据时的错误
      }
    }

    return {
      success,
      failed: failedList.length,
    };
  }
}

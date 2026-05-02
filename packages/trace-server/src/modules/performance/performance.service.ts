import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { PerformanceMetricsQueryDto } from './dto/performance-metrics-query.dto';
import {
  PerformanceMetricsResponseDto,
  PerformanceItemDto,
} from './dto/performance-metrics-response.dto';

interface BuriedPointRecord {
  id: bigint;
  project_id: bigint;
  device_id: string;
  event_time: bigint;
  v_page_url: string | null;
  data: unknown;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly CACHE_TTL = 60;
  private readonly CACHE_PREFIX = 'performance:metrics';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getMetrics(query: PerformanceMetricsQueryDto): Promise<PerformanceMetricsResponseDto> {
    const {
      projectId,
      startTime,
      endTime,
      metricType,
      pageUrl,
      pageNum = 1,
      pageSize = 20,
    } = query;

    const now = Date.now();
    if (startTime > now) {
      this.logger.warn(`查询时间 startTime=${startTime} 在未来`);
    }
    if (endTime > now) {
      this.logger.warn(`查询时间 endTime=${endTime} 在未来`);
    }

    const cacheKey = this.redis.generateCacheKey(
      this.CACHE_PREFIX,
      String(projectId),
      String(startTime),
      String(endTime),
      metricType || 'all',
      pageUrl || 'all',
      String(pageNum),
      String(pageSize),
    );

    const cached = await this.redis.getJson<PerformanceMetricsResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`缓存命中: ${cacheKey}`);
      return cached;
    }

    try {
      const skip = (pageNum - 1) * pageSize;

      const countSql = this.buildCountSql(projectId, startTime, endTime, pageUrl);
      const dataSql = this.buildDataSql(projectId, startTime, endTime, pageUrl, skip, pageSize);

      const [totalResult, recordsResult] = await Promise.all([
        (this.prisma as any).$queryRawUnsafe(countSql),
        (this.prisma as any).$queryRawUnsafe(dataSql),
      ]);

      const total = Number((totalResult as any[])[0]?.count || 0);

      const list: PerformanceItemDto[] = (recordsResult as BuriedPointRecord[]).map(
        (record: BuriedPointRecord) => {
          const data = record.data as any;
          const fcp = data?.fcp || 0;
          const lcp = data?.lcp || 0;

          return {
            pageUrl: record.v_page_url || '/',
            fcp,
            lcp,
            eventTime: Number(record.event_time),
          };
        },
      );

      let totalFCP = 0;
      let totalLCP = 0;
      let totalDNS = 0;
      let whiteScreenCount = 0;

      (recordsResult as BuriedPointRecord[]).forEach((record: BuriedPointRecord) => {
        const data = record.data as any;
        const fcp = data?.fcp || 0;
        const lcp = data?.lcp || 0;
        const dns = data?.dns || 0;

        totalFCP += fcp;
        totalLCP += lcp;
        totalDNS += dns;

        const isWhiteScreen =
          data?.isWhiteScreen || (fcp === 0 && lcp === 0 && data?.domContentLoadedTime > 3000);
        if (isWhiteScreen) {
          whiteScreenCount++;
        }
      });

      const count = recordsResult.length;
      const pages = Math.ceil(total / pageSize);

      const response: PerformanceMetricsResponseDto = {
        avgFCP: count > 0 ? Math.round(totalFCP / count) : 0,
        avgLCP: count > 0 ? Math.round(totalLCP / count) : 0,
        avgDNS: count > 0 ? Math.round(totalDNS / count) : 0,
        whiteScreenRate: count > 0 ? whiteScreenCount / count : 0,
        total,
        pages,
        list,
      };

      await this.redis.setJson(cacheKey, response, this.CACHE_TTL);
      this.logger.debug(`缓存写入: ${cacheKey}`);

      return response;
    } catch (error) {
      this.logger.error(`查询性能指标失败: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('查询性能数据失败，请稍后重试');
    }
  }

  private buildCountSql(
    projectId: number,
    startTime: number,
    endTime: number,
    pageUrl?: string,
  ): string {
    let sql = `SELECT COUNT(*) as count FROM buried_point_data WHERE project_id = ${projectId} AND event_type = 'performance' AND event_time >= ${startTime} AND event_time <= ${endTime}`;
    if (pageUrl) {
      sql += ` AND v_page_url = '${pageUrl.replace(/'/g, "''")}'`;
    }
    return sql;
  }

  private buildDataSql(
    projectId: number,
    startTime: number,
    endTime: number,
    pageUrl?: string,
    skip: number = 0,
    pageSize: number = 20,
  ): string {
    let sql = `SELECT id, project_id, device_id, event_time, v_page_url, data FROM buried_point_data WHERE project_id = ${projectId} AND event_type = 'performance' AND event_time >= ${startTime} AND event_time <= ${endTime}`;
    if (pageUrl) {
      sql += ` AND v_page_url = '${pageUrl.replace(/'/g, "''")}'`;
    }
    sql += ` ORDER BY event_time DESC LIMIT ${skip}, ${pageSize}`;
    return sql;
  }
}

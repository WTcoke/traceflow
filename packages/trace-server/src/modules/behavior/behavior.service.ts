import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { BehaviorPathsQueryDto } from './dto/behavior-paths-query.dto';
import { BehaviorPathsResponseDto, BehaviorPathItemDto } from './dto/behavior-paths-response.dto';

interface BuriedPointRecord {
  id: bigint;
  project_id: bigint;
  device_id: string;
  user_id: string | null;
  event_time: bigint;
  v_page_url: string | null;
  data: unknown;
}

@Injectable()
export class BehaviorService {
  private readonly logger = new Logger(BehaviorService.name);
  private readonly CACHE_TTL = 60;
  private readonly CACHE_PREFIX = 'behavior:paths';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getPaths(query: BehaviorPathsQueryDto): Promise<BehaviorPathsResponseDto> {
    const { projectId, deviceId, userId, startTime, endTime, pageNum = 1, pageSize = 10 } = query;

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
      deviceId || 'all',
      userId || 'all',
      String(pageNum),
      String(pageSize),
    );

    const cached = await this.redis.getJson<BehaviorPathsResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`缓存命中: ${cacheKey}`);
      return cached;
    }

    try {
      const skip = (pageNum - 1) * pageSize;

      const countSql = this.buildCountSql(projectId, startTime, endTime, deviceId, userId);
      const dataSql = this.buildDataSql(
        projectId,
        startTime,
        endTime,
        deviceId,
        userId,
        skip,
        pageSize,
      );

      const [totalResult, recordsResult] = await Promise.all([
        (this.prisma as any).$queryRawUnsafe(countSql),
        (this.prisma as any).$queryRawUnsafe(dataSql),
      ]);

      const total = Number((totalResult as any[])[0]?.count || 0);

      const list: BehaviorPathItemDto[] = (recordsResult as BuriedPointRecord[]).map(
        (record: BuriedPointRecord) => {
          const data = record.data as any;
          return {
            pageUrl: record.v_page_url || '/',
            eventName: data?.eventName || 'unknown',
            element: data?.element || '',
            eventTime: Number(record.event_time),
          };
        },
      );

      const pages = Math.ceil(total / pageSize);

      const response: BehaviorPathsResponseDto = {
        total,
        pages,
        list,
      };

      await this.redis.setJson(cacheKey, response, this.CACHE_TTL);
      this.logger.debug(`缓存写入: ${cacheKey}`);

      return response;
    } catch (error) {
      this.logger.error(`查询行为路径失败: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('查询行为数据失败，请稍后重试');
    }
  }

  private buildCountSql(
    projectId: number,
    startTime: number,
    endTime: number,
    deviceId?: string,
    userId?: string,
  ): string {
    let sql = `SELECT COUNT(*) as count FROM buried_point_data WHERE project_id = ${projectId} AND event_type = 'behavior' AND event_time >= ${startTime} AND event_time <= ${endTime}`;
    if (deviceId) {
      sql += ` AND device_id = '${deviceId.replace(/'/g, "''")}'`;
    }
    if (userId) {
      sql += ` AND user_id = '${userId.replace(/'/g, "''")}'`;
    }
    return sql;
  }

  private buildDataSql(
    projectId: number,
    startTime: number,
    endTime: number,
    deviceId?: string,
    userId?: string,
    skip: number = 0,
    pageSize: number = 10,
  ): string {
    let sql = `SELECT id, project_id, device_id, user_id, event_time, v_page_url, data FROM buried_point_data WHERE project_id = ${projectId} AND event_type = 'behavior' AND event_time >= ${startTime} AND event_time <= ${endTime}`;
    if (deviceId) {
      sql += ` AND device_id = '${deviceId.replace(/'/g, "''")}'`;
    }
    if (userId) {
      sql += ` AND user_id = '${userId.replace(/'/g, "''")}'`;
    }
    sql += ` ORDER BY event_time DESC LIMIT ${skip}, ${pageSize}`;
    return sql;
  }
}

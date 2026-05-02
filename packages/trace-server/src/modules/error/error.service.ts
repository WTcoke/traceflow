import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { ErrorListQueryDto } from './dto/error-list-query.dto';
import { ErrorListResponseDto, ErrorItemDto } from './dto/error-list-response.dto';

/**
 * BuriedPointData 本地类型定义（因为 Prisma 模型有 @@ignore）
 */
interface BuriedPointRecord {
  id: bigint;
  project_id: bigint;
  device_id: string;
  event_time: bigint;
  v_error_type: string | null;
  v_page_url: string | null;
  data: unknown;
}

@Injectable()
export class ErrorService {
  private readonly logger = new Logger(ErrorService.name);
  private readonly CACHE_TTL = 60; // 60秒缓存
  private readonly CACHE_PREFIX = 'error:list';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getList(query: ErrorListQueryDto): Promise<ErrorListResponseDto> {
    const { projectId, startTime, endTime, errorType, pageNum = 1, pageSize = 10 } = query;

    // 校验时间范围，防止未来数据
    const now = Date.now();
    if (startTime > now) {
      this.logger.warn(`查询时间 startTime=${startTime} 在未来`);
    }
    if (endTime > now) {
      this.logger.warn(`查询时间 endTime=${endTime} 在未来`);
    }

    // 生成缓存 Key
    const cacheKey = this.redis.generateCacheKey(
      this.CACHE_PREFIX,
      String(projectId),
      String(startTime),
      String(endTime),
      errorType || 'all',
      String(pageNum),
      String(pageSize),
    );

    // 尝试从 Redis 缓存读取
    const cached = await this.redis.getJson<ErrorListResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`从缓存返回错误列表: projectId=${projectId}`);
      return cached;
    }

    try {
      const skip = (pageNum - 1) * pageSize;

      // 构建安全的 SQL 查询（使用原生 SQL 因为模型有 @@ignore）
      const countSql = this.buildCountSql(projectId, startTime, endTime, errorType);
      const dataSql = this.buildDataSql(projectId, startTime, endTime, errorType, skip, pageSize);

      // 并行查询总数和列表
      const [totalResult, recordsResult] = await Promise.all([
        (this.prisma as any).$queryRawUnsafe(countSql),
        (this.prisma as any).$queryRawUnsafe(dataSql),
      ]);

      const total = Number((totalResult as any[])[0]?.count || 0);

      // 安全地转换数据
      const list: ErrorItemDto[] = (recordsResult as BuriedPointRecord[]).map(
        (record: BuriedPointRecord) => {
          const data = record.data as Record<string, unknown>;
          return {
            id: String(record.id), // BigInt 安全转换为 string
            errorType: record.v_error_type || 'Unknown',
            message: typeof data?.message === 'string' ? data.message : 'No message',
            pageUrl: record.v_page_url || '/',
            deviceId: record.device_id,
            eventTime: Number(record.event_time), // 时间戳在安全范围内
            stack: typeof data?.stack === 'string' ? data.stack : '',
          };
        },
      );

      const pages = Math.ceil(total / pageSize);

      const response: ErrorListResponseDto = {
        total,
        pages,
        list,
      };

      // 写入 Redis 缓存
      await this.redis.setJson(cacheKey, response, this.CACHE_TTL);
      this.logger.debug(`缓存错误列表数据: projectId=${projectId}, total=${total}`);

      return response;
    } catch (error) {
      this.logger.error(`查询错误列表失败: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('查询错误数据失败，请稍后重试');
    }
  }

  private buildCountSql(
    projectId: number,
    startTime: number,
    endTime: number,
    errorType?: string,
  ): string {
    let sql = `SELECT COUNT(*) as count FROM buried_point_data WHERE project_id = ${projectId} AND event_type = 'error' AND event_time >= ${startTime} AND event_time <= ${endTime}`;
    if (errorType) {
      sql += ` AND v_error_type = '${errorType.replace(/'/g, "''")}'`;
    }
    return sql;
  }

  private buildDataSql(
    projectId: number,
    startTime: number,
    endTime: number,
    errorType?: string,
    skip: number = 0,
    pageSize: number = 10,
  ): string {
    let sql = `SELECT id, project_id, device_id, event_time, v_error_type, v_page_url, data FROM buried_point_data WHERE project_id = ${projectId} AND event_type = 'error' AND event_time >= ${startTime} AND event_time <= ${endTime}`;
    if (errorType) {
      sql += ` AND v_error_type = '${errorType.replace(/'/g, "''")}'`;
    }
    sql += ` ORDER BY event_time DESC LIMIT ${skip}, ${pageSize}`;
    return sql;
  }
}

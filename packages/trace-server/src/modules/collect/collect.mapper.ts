import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SingleBuriedPointDto } from './dto/buried-point.dto';

/**
 * 埋点数据Mapper（使用原生SQL）
 */
@Injectable()
export class CollectMapper {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成分布式ID（雪花算法模拟）
   */
  private generateId(): bigint {
    const timestamp = BigInt(Date.now());
    const random = BigInt(Math.floor(Math.random() * 1000));
    return (timestamp << BigInt(10)) | random;
  }

  /**
   * 插入单条埋点数据
   */
  async insertSingle(
    projectId: bigint,
    data: SingleBuriedPointDto,
    parsedData?: {
      os?: string;
      browser?: string;
      country?: string;
      province?: string;
      city?: string;
    },
  ): Promise<void> {
    const id = this.generateId();
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO buried_point_data (
        id, msg_id, project_id, device_id, user_id, event_time, event_type,
        platform, user_agent, ip, os, browser, country, province, city,
        data, is_abnormal, v_error_type, v_page_url, create_time
      ) VALUES (
        ${id},
        ${data.msgId},
        ${projectId},
        ${data.deviceId},
        ${data.userId || null},
        ${BigInt(data.eventTime)},
        ${data.eventType},
        ${data.platform},
        ${data.userAgent || null},
        ${data.ip || null},
        ${parsedData?.os || data.os || null},
        ${parsedData?.browser || data.browser || null},
        ${parsedData?.country || data.country || null},
        ${parsedData?.province || data.province || null},
        ${parsedData?.city || data.city || null},
        ${JSON.stringify(data.data)},
        ${0},
        ${null},
        ${null},
        ${now}
      )
    `;
  }

  /**
   * 批量插入埋点数据
   */
  async insertBatch(
    projectId: bigint,
    list: Array<{
      data: SingleBuriedPointDto;
      parsed?: {
        os?: string;
        browser?: string;
        country?: string;
        province?: string;
        city?: string;
      };
    }>,
  ): Promise<void> {
    if (list.length === 0) return;

    const now = new Date();
    const values = list.map((item) => {
      const { data, parsed } = item;
      const id = this.generateId();
      return `(
        ${id},
        '${data.msgId}',
        ${projectId},
        '${data.deviceId}',
        ${data.userId ? `'${data.userId}'` : 'NULL'},
        ${data.eventTime},
        '${data.eventType}',
        '${data.platform}',
        ${data.userAgent ? `'${data.userAgent.replace(/'/g, "''")}'` : 'NULL'},
        ${data.ip ? `'${data.ip}'` : 'NULL'},
        ${parsed?.os || data.os ? `'${parsed?.os || data.os}'` : 'NULL'},
        ${parsed?.browser || data.browser ? `'${parsed?.browser || data.browser}'` : 'NULL'},
        ${parsed?.country || data.country ? `'${parsed?.country || data.country}'` : 'NULL'},
        ${parsed?.province || data.province ? `'${parsed?.province || data.province}'` : 'NULL'},
        ${parsed?.city || data.city ? `'${parsed?.city || data.city}'` : 'NULL'},
        '${JSON.stringify(data.data).replace(/'/g, "''")}',
        0,
        NULL,
        NULL,
        '${now.toISOString().replace('T', ' ').replace('Z', '')}'
      )`;
    });

    const sql = `
      INSERT INTO buried_point_data (
        id, msg_id, project_id, device_id, user_id, event_time, event_type,
        platform, user_agent, ip, os, browser, country, province, city,
        data, is_abnormal, v_error_type, v_page_url, create_time
      ) VALUES ${values.join(',')}
    `;

    await this.prisma.$executeRawUnsafe(sql);
  }

  /**
   * 插入异常数据
   */
  async insertAbnormal(
    projectId: bigint,
    originalData: string,
    errorReason: string,
  ): Promise<void> {
    await this.prisma.abnormalData.create({
      data: {
        projectId,
        originalData,
        errorReason,
      },
    });
  }
}

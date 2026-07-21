import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CleanedBuriedPointData } from './dto/buried-point.dto';

/**
 * 埋点数据Mapper（使用原生SQL）
 */
@Injectable()
export class CollectMapper {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成分布式ID（改进的雪花算法模拟）
   * 使用更大的随机数范围和进程ID确保唯一性
   */
  private generateId(): bigint {
    const timestamp = BigInt(Date.now());
    // 使用更大的随机数范围（0-999999）
    const random = BigInt(Math.floor(Math.random() * 1000000));
    // 加入进程ID增加唯一性
    const pid = BigInt(process.pid % 1000);
    // timestamp: 42 bits, pid: 10 bits, random: 12 bits
    return (timestamp << BigInt(22)) | (pid << BigInt(12)) | (random & BigInt(4095));
  }

  /**
   * 插入单条埋点数据
   */
  async insertSingle(projectId: bigint, data: CleanedBuriedPointData): Promise<void> {
    const id = this.generateId();
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT IGNORE INTO buried_point_data (
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
        ${data.os || null},
        ${data.browser || null},
        ${data.country || null},
        ${data.province || null},
        ${data.city || null},
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
  async insertBatch(projectId: bigint, list: CleanedBuriedPointData[]): Promise<void> {
    if (list.length === 0) return;

    const now = new Date();
    const values = list.map((data) => {
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
        ${data.os ? `'${data.os}'` : 'NULL'},
        ${data.browser ? `'${data.browser}'` : 'NULL'},
        ${data.country ? `'${data.country}'` : 'NULL'},
        ${data.province ? `'${data.province}'` : 'NULL'},
        ${data.city ? `'${data.city}'` : 'NULL'},
        '${JSON.stringify(data.data).replace(/'/g, "''")}',
        0,
        NULL,
        NULL,
        '${now.toISOString().replace('T', ' ').replace('Z', '')}'
      )`;
    });

    const sql = `
      INSERT IGNORE INTO buried_point_data (
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
  async insertAbnormal(projectId: bigint, msgId: string, errorReason: string): Promise<void> {
    await this.prisma.abnormalData.create({
      data: {
        projectId,
        originalData: msgId,
        errorReason,
      },
    });
  }

  /**
   * 批量插入异常数据
   */
  async insertAbnormalBatch(
    projectId: bigint,
    abnormalList: Array<{ msgId: string; errorReason: string }>,
  ): Promise<void> {
    if (abnormalList.length === 0) return;

    const values = abnormalList.map((item) => {
      const escapedMsgId = item.msgId.replace(/'/g, "''");
      const escapedReason = item.errorReason.replace(/'/g, "''");
      return `(${projectId}, '${escapedMsgId}', '${escapedReason}')`;
    });

    const sql = `
      INSERT INTO abnormal_data (project_id, original_data, error_reason)
      VALUES ${values.join(',')}
    `;

    await this.prisma.$executeRawUnsafe(sql);
  }
}

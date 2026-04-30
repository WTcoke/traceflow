import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TraceEventType } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取统计概览（PV/UV/错误数）
   * @param projectId 项目ID
   * @param startTime 开始时间戳（毫秒）
   * @param endTime 结束时间戳（毫秒）
   * @param granularity 时间粒度（hour/day）
   * @returns 统计概览数据
   */
  async getOverview(
    projectId: string,
    startTime: bigint,
    endTime: bigint,
    granularity: string = 'hour',
  ) {
    const where: any = {
      timestamp: {
        gte: startTime,
        lte: endTime,
      },
    };

    // 页面访问量（PV）- page类型事件
    const pv = await this.prisma.traceEvent.count({
      where: { ...where, eventType: TraceEventType.page },
    });

    // 独立用户数（UV）- 去重userId和anonymousId
    const authenticatedUsersResult = await this.prisma.traceEvent.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: true,
    });
    const authenticatedUsers = authenticatedUsersResult.length;

    const anonymousUsersResult = await this.prisma.traceEvent.groupBy({
      by: ['anonymousId'],
      where: { ...where, userId: null },
      _count: true,
    });
    const anonymousUsers = anonymousUsersResult.length;

    const uv = authenticatedUsers + anonymousUsers;

    // 错误数 - error类型事件
    const errorCount = await this.prisma.traceEvent.count({
      where: { ...where, eventType: TraceEventType.error },
    });

    // 性能指标（模拟数据，实际应从properties中提取）
    const performanceIndex = {
      avgFCP: 800,
      avgLCP: 1200,
    };

    return {
      pv,
      uv,
      errorCount,
      performanceIndex,
    };
  }
}

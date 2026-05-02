import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StatisticsOverviewQueryDto } from './dto/statistics-overview-query.dto';
import {
  StatisticsOverviewResponseDto,
  PerformanceIndexDto,
} from './dto/statistics-overview-response.dto';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(query: StatisticsOverviewQueryDto): Promise<StatisticsOverviewResponseDto> {
    const { projectId, startTime, endTime, granularity = 'hour' } = query;

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const statistics = await this.prisma.statistics.findMany({
      where: {
        projectId: BigInt(projectId),
        statTime: {
          gte: startDate,
          lte: endDate,
        },
        timeGranularity: granularity as 'hour' | 'day',
      },
      orderBy: { statTime: 'desc' },
    });

    if (statistics.length === 0) {
      return {
        pv: 0,
        uv: 0,
        errorCount: 0,
        performanceIndex: { avgFCP: 0, avgLCP: 0 },
      };
    }

    let totalPv = BigInt(0);
    let totalUv = BigInt(0);
    let totalErrorCount = BigInt(0);
    let totalFcp = 0;
    let totalLcp = 0;
    let performanceCount = 0;

    for (const stat of statistics) {
      totalPv += stat.pv;
      totalUv += stat.uv;
      totalErrorCount += stat.errorCount;

      if (stat.performanceIndex) {
        const perfIndex = stat.performanceIndex as { avgFCP?: number; avgLCP?: number };
        if (perfIndex.avgFCP) totalFcp += perfIndex.avgFCP;
        if (perfIndex.avgLCP) totalLcp += perfIndex.avgLCP;
        performanceCount++;
      }
    }

    const performanceIndex: PerformanceIndexDto = {
      avgFCP: performanceCount > 0 ? Math.round(totalFcp / performanceCount) : 0,
      avgLCP: performanceCount > 0 ? Math.round(totalLcp / performanceCount) : 0,
    };

    return {
      pv: Number(totalPv),
      uv: Number(totalUv),
      errorCount: Number(totalErrorCount),
      performanceIndex,
    };
  }
}

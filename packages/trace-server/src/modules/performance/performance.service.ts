import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PerformanceMetricsQueryDto } from './dto/performance-metrics-query.dto';
import {
  PerformanceMetricsResponseDto,
  PerformanceItemDto,
} from './dto/performance-metrics-response.dto';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(query: PerformanceMetricsQueryDto): Promise<PerformanceMetricsResponseDto> {
    const { projectId, startTime, endTime, metricType, pageUrl } = query;

    const where: any = {
      projectId: BigInt(projectId),
      eventType: 'performance',
      eventTime: {
        gte: BigInt(startTime),
        lte: BigInt(endTime),
      },
    };

    if (pageUrl) {
      where.vPageUrl = pageUrl;
    }

    const records = await this.prisma.buriedPointData.findMany({
      where,
      orderBy: { eventTime: 'desc' },
    });

    let totalFCP = 0;
    let totalLCP = 0;
    let totalDNS = 0;
    let count = 0;
    let whiteScreenCount = 0;

    const list: PerformanceItemDto[] = records.map(
      (record: { data: any; vPageUrl: any; eventTime: any }) => {
        const data = record.data as any;
        const fcp = data?.fcp || 0;
        const lcp = data?.lcp || 0;
        const dns = data?.dns || 0;

        totalFCP += fcp;
        totalLCP += lcp;
        totalDNS += dns;
        count++;

        if (fcp === 0 && lcp === 0) {
          whiteScreenCount++;
        }

        return {
          pageUrl: record.vPageUrl || '/',
          fcp,
          lcp,
          eventTime: Number(record.eventTime),
        };
      },
    );

    return {
      avgFCP: count > 0 ? Math.round(totalFCP / count) : 0,
      avgLCP: count > 0 ? Math.round(totalLCP / count) : 0,
      avgDNS: count > 0 ? Math.round(totalDNS / count) : 0,
      whiteScreenRate: count > 0 ? whiteScreenCount / count : 0,
      list,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { StatisticsOverviewQueryDto } from './dto/statistics-overview-query.dto';
import { StatisticsOverviewResponseDto } from './dto/statistics-overview-response.dto';

@Injectable()
export class StatisticsService {
  getOverview(query: StatisticsOverviewQueryDto): StatisticsOverviewResponseDto {
    const { projectId, startTime, endTime, granularity = 'hour' } = query;

    return {
      pv: this.calculatePV(projectId, startTime, endTime, granularity),
      uv: this.calculateUV(projectId, startTime, endTime, granularity),
      errorCount: this.calculateErrorCount(projectId, startTime, endTime, granularity),
      performanceIndex: this.calculatePerformanceIndex(projectId, startTime, endTime, granularity),
    };
  }

  private calculatePV(
    projectId: number,
    startTime: number,
    endTime: number,
    granularity: string,
  ): number {
    return Math.floor(Math.random() * 100000) + 50000;
  }

  private calculateUV(
    projectId: number,
    startTime: number,
    endTime: number,
    granularity: string,
  ): number {
    return Math.floor(Math.random() * 50000) + 10000;
  }

  private calculateErrorCount(
    projectId: number,
    startTime: number,
    endTime: number,
    granularity: string,
  ): number {
    return Math.floor(Math.random() * 500) + 10;
  }

  private calculatePerformanceIndex(
    projectId: number,
    startTime: number,
    endTime: number,
    granularity: string,
  ) {
    return {
      avgFCP: Math.floor(Math.random() * 1000) + 500,
      avgLCP: Math.floor(Math.random() * 1500) + 800,
    };
  }
}

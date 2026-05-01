import { Injectable } from '@nestjs/common';
import { PerformanceMetricsQueryDto } from './dto/performance-metrics-query.dto';
import { PerformanceMetricsResponseDto } from './dto/performance-metrics-response.dto';

@Injectable()
export class PerformanceService {
  getMetrics(query: PerformanceMetricsQueryDto): PerformanceMetricsResponseDto {
    const { metricType } = query;

    return {
      avgFCP: 450,
      avgLCP: 1100,
      avgDNS: 30,
      whiteScreenRate: 0.02,
      list: this.generateMockData(metricType),
    };
  }

  private generateMockData(metricType?: string) {
    const mockList = [];
    const pages = ['/home', '/about', '/product', '/contact'];

    for (let i = 0; i < pages.length; i++) {
      const item: any = {
        pageUrl: pages[i],
        eventTime: Date.now() - i * 3600000,
      };

      if (!metricType || metricType === 'fcp') {
        item.fcp = Math.floor(Math.random() * 300) + 200;
      }
      if (!metricType || metricType === 'lcp') {
        item.lcp = Math.floor(Math.random() * 500) + 800;
      }

      mockList.push(item);
    }

    return mockList;
  }
}

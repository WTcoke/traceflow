import { ApiProperty } from '@nestjs/swagger';

export class PerformanceItemDto {
  @ApiProperty({ description: '页面URL', example: '/home' })
  pageUrl: string;

  @ApiProperty({ description: 'FCP', example: 450 })
  fcp: number;

  @ApiProperty({ description: 'LCP', example: 1100 })
  lcp: number;

  @ApiProperty({ description: '事件时间（毫秒时间戳）', example: 1714147200000 })
  eventTime: number;
}

export class PerformanceMetricsResponseDto {
  @ApiProperty({ description: '平均FCP', example: 450 })
  avgFCP: number;

  @ApiProperty({ description: '平均LCP', example: 1100 })
  avgLCP: number;

  @ApiProperty({ description: '平均DNS', example: 30 })
  avgDNS: number;

  @ApiProperty({ description: '白屏率', example: 0.02 })
  whiteScreenRate: number;

  @ApiProperty({ description: '性能指标列表', type: [PerformanceItemDto] })
  list: PerformanceItemDto[];
}
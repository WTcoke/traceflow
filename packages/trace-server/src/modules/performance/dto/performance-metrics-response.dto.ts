import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerformanceMetricItemDto {
  @ApiProperty({ description: '页面URL', example: '/home' })
  pageUrl: string;

  @ApiPropertyOptional({ description: '首次内容绘制时间（毫秒）', example: 400 })
  fcp?: number;

  @ApiPropertyOptional({ description: '最大内容绘制时间（毫秒）', example: 1050 })
  lcp?: number;

  @ApiProperty({ description: '事件时间（毫秒时间戳）', example: 1714147200000 })
  eventTime: number;
}

export class PerformanceMetricsResponseDto {
  @ApiProperty({ description: '平均首次内容绘制时间（毫秒）', example: 450 })
  avgFCP: number;

  @ApiProperty({ description: '平均最大内容绘制时间（毫秒）', example: 1100 })
  avgLCP: number;

  @ApiProperty({ description: '平均DNS解析时间（毫秒）', example: 30 })
  avgDNS: number;

  @ApiProperty({ description: '白屏率', example: 0.02 })
  whiteScreenRate: number;

  @ApiProperty({ description: '性能指标列表', type: [PerformanceMetricItemDto] })
  list: PerformanceMetricItemDto[];
}

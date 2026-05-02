import { ApiProperty } from '@nestjs/swagger';

export class PerformanceIndexDto {
  @ApiProperty({ description: '平均首次内容绘制时间（毫秒）', example: 450 })
  avgFCP: number;

  @ApiProperty({ description: '平均最大内容绘制时间（毫秒）', example: 1100 })
  avgLCP: number;
}

export class StatisticsOverviewResponseDto {
  @ApiProperty({ description: '页面浏览量', example: 152000 })
  pv: number;

  @ApiProperty({ description: '独立访客数', example: 34200 })
  uv: number;

  @ApiProperty({ description: '错误数量', example: 120 })
  errorCount: number;

  @ApiProperty({ description: '性能指标' })
  performanceIndex: PerformanceIndexDto;
}

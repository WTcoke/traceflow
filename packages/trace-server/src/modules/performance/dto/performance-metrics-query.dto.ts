import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PerformanceMetricsQueryDto {
  @ApiProperty({ description: '项目ID', example: 1 })
  @IsNotEmpty({ message: 'projectId 必填' })
  @Type(() => Number)
  @IsNumber({}, { message: 'projectId 必须是数字' })
  projectId: number;

  @ApiProperty({ description: '开始时间（毫秒时间戳）', example: 1699200000000 })
  @IsNotEmpty({ message: 'startTime 必填' })
  @Type(() => Number)
  @IsNumber({}, { message: 'startTime 必须是数字' })
  startTime: number;

  @ApiProperty({ description: '结束时间（毫秒时间戳）', example: 1699286400000 })
  @IsNotEmpty({ message: 'endTime 必填' })
  @Type(() => Number)
  @IsNumber({}, { message: 'endTime 必须是数字' })
  endTime: number;

  @ApiPropertyOptional({ description: '指标类型', example: 'fcp' })
  @IsOptional()
  @IsString()
  metricType?: string;

  @ApiPropertyOptional({ description: '页面URL', example: '/home' })
  @IsOptional()
  @IsString()
  pageUrl?: string;
}
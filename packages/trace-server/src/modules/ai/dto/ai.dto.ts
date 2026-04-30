import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsString as IsStringValidator,
} from 'class-validator';
import { AiMode, AiAnalysisType } from '../interfaces/ai.interfaces';

export class AiQueryDto {
  @ApiProperty({ description: '项目ID', example: 10 })
  @IsNumber()
  @IsNotEmpty()
  projectId!: number;

  @ApiProperty({ description: '查询问题', example: '昨天首页的点击量是多少？' })
  @IsString()
  @IsNotEmpty()
  question!: string;
}

export class AiAnalyzeDto {
  @ApiProperty({ description: '项目ID', example: 10 })
  @IsNumber()
  @IsNotEmpty()
  projectId!: number;

  @ApiProperty({
    description: '分析类型',
    example: 'anomaly_detection',
  })
  @IsString()
  @IsNotEmpty()
  analysisType!: string;

  @ApiProperty({ description: '开始时间（毫秒时间戳）', example: 1714140000000 })
  @IsNumber()
  @IsNotEmpty()
  startTime!: number;

  @ApiProperty({ description: '结束时间（毫秒时间戳）', example: 1714147200000 })
  @IsNumber()
  @IsNotEmpty()
  endTime!: number;

  @ApiPropertyOptional({ description: '分析选项' })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}

export class AiResultQueryDto {
  @ApiProperty({ description: '项目ID', example: 10 })
  @IsStringValidator()
  @IsNotEmpty()
  projectId!: string;

  @ApiPropertyOptional({ description: '分析类型' })
  @IsStringValidator()
  @IsOptional()
  analysisType?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsNumber()
  @IsOptional()
  pageNum?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

export class AiQueryResponseDto {
  @ApiProperty({ description: '生成的 SQL 语句' })
  sql!: string;

  @ApiProperty({ description: '查询结果', type: 'array' })
  result!: Array<Record<string, any>>;

  @ApiProperty({ description: '结果解释' })
  explanation!: string;
}

export class AiAnalyzeResponseDto {
  @ApiProperty({ description: '任务ID' })
  taskId!: string;
}

export class AiResultItemDto {
  @ApiProperty({ description: '记录ID' })
  id!: bigint;

  @ApiProperty({ description: '分析类型' })
  analysisType!: string;

  @ApiProperty({ description: '分析数据', type: 'object' })
  analysisData!: Record<string, any>;

  @ApiPropertyOptional({ description: 'SQL日志' })
  sqlLog?: string;

  @ApiProperty({ description: '创建时间' })
  createTime!: number;
}

export class AiResultResponseDto {
  @ApiProperty({ description: '总数' })
  total!: number;

  @ApiProperty({ description: '结果列表', type: [AiResultItemDto] })
  list!: AiResultItemDto[];
}

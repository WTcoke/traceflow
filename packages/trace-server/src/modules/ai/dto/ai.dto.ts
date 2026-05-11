import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// 枚举定义
export enum AiMode {
  CHAIN = 'chain',
  RAG = 'rag',
  AGENT = 'agent',
}

export enum AiAnalysisType {
  STATISTICS = 'statistics',
  ERROR_ANALYSIS = 'error_analysis',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  BEHAVIOR_ANALYSIS = 'behavior_analysis',
  SPEC_VALIDATION = 'spec_validation',
  ANOMALY_DETECTION = 'anomaly_detection',
  NATURAL_QUERY = 'natural_query',
}

// 请求 DTO
export class AiQueryDto {
  @ApiProperty({ description: '项目ID', example: 10 })
  @IsNotEmpty({ message: 'projectId 不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'projectId 必须是数字' })
  projectId: number;

  @ApiProperty({ description: '查询问题', example: '昨天首页的点击量是多少？' })
  @IsNotEmpty({ message: 'question 不能为空' })
  @IsString({ message: 'question 必须是字符串' })
  question: string;
}

export class AiAnalyzeDto {
  @ApiProperty({ description: '项目ID', example: 10 })
  @IsNotEmpty({ message: 'projectId 不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'projectId 必须是数字' })
  projectId: number;

  @ApiProperty({
    description: '分析类型',
    example: 'anomaly_detection',
  })
  @IsNotEmpty({ message: 'analysisType 不能为空' })
  @IsString({ message: 'analysisType 必须是字符串' })
  analysisType: string;

  @ApiProperty({ description: '开始时间（毫秒时间戳）', example: 1714140000000 })
  @IsNotEmpty({ message: 'startTime 不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'startTime 必须是数字' })
  startTime: number;

  @ApiProperty({ description: '结束时间（毫秒时间戳）', example: 1714147200000 })
  @IsNotEmpty({ message: 'endTime 不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'endTime 必须是数字' })
  endTime: number;

  @ApiPropertyOptional({ description: '分析选项' })
  @IsOptional()
  @IsObject({ message: 'options 必须是对象' })
  options?: Record<string, any>;
}

export class AiResultQueryDto {
  @ApiProperty({ description: '项目ID', example: 10 })
  @IsNotEmpty({ message: 'projectId 不能为空' })
  @IsString({ message: 'projectId 必须是字符串' })
  projectId: string;

  @ApiPropertyOptional({ description: '分析类型' })
  @IsOptional()
  @IsString({ message: 'analysisType 必须是字符串' })
  analysisType?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'pageNum 必须是数字' })
  @Min(1, { message: 'pageNum 最小为 1' })
  pageNum?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize 必须是数字' })
  @Min(1, { message: 'pageSize 最小为 1' })
  @Max(100, { message: 'pageSize 最大为 100' })
  pageSize?: number = 10;
}

// 响应 DTO
export class AiQueryResponseDto {
  @ApiProperty({ description: '生成的 SQL 语句' })
  sql: string;

  @ApiProperty({ description: '查询结果', type: 'array' })
  result: Array<Record<string, any>>;

  @ApiProperty({ description: '结果解释' })
  explanation: string;
}

export class AiAnalyzeResponseDto {
  @ApiProperty({ description: '任务ID' })
  taskId: string;
}

export class AiResultItemDto {
  @ApiProperty({ description: '记录ID' })
  id: number;

  @ApiProperty({ description: '分析类型' })
  analysisType: string;

  @ApiProperty({ description: '分析数据', type: 'object' })
  analysisData: Record<string, any>;

  @ApiPropertyOptional({ description: 'SQL日志' })
  sqlLog?: string;

  @ApiProperty({ description: '创建时间' })
  createTime: number;
}

export class AiResultResponseDto {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '结果列表', type: [AiResultItemDto] })
  list: AiResultItemDto[];
}

// 业务 DTO（内部使用）
export class AiAnalysisResultDto {
  @ApiPropertyOptional({ description: '记录ID' })
  id?: number;

  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiProperty({ description: '分析类型' })
  analysisType: string;

  @ApiProperty({ description: '分析数据', type: 'object' })
  analysisData: Record<string, any>;

  @ApiPropertyOptional({ description: 'SQL日志' })
  sqlLog?: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createTime?: Date;
}

export class AiQueryRequestDto {
  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiProperty({ description: '查询问题' })
  question: string;
}

export class AiAnalyzeDataDto {
  @ApiPropertyOptional({ description: '开始时间' })
  startTime?: number;

  @ApiPropertyOptional({ description: '结束时间' })
  endTime?: number;

  @ApiPropertyOptional({ description: '事件类型列表', type: [String] })
  eventTypes?: string[];

  @ApiPropertyOptional({ description: '数据类型', type: 'object' })
  dataTypes?: Record<string, any>;
}

export class AiAnalyzeRequestDto {
  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiProperty({ description: '分析类型' })
  analysisType: string;

  @ApiPropertyOptional({ description: '数据', type: AiAnalyzeDataDto })
  data?: AiAnalyzeDataDto;

  @ApiPropertyOptional({ description: '选项', type: 'object' })
  options?: Record<string, any>;
}

export class AiResultsQueryRequestDto {
  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiPropertyOptional({ description: '分析类型' })
  analysisType?: string;

  @ApiProperty({ description: '页码' })
  pageNum: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;
}

export class AiResultsResponseDto {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '结果列表', type: [AiResultItemDto] })
  list: AiResultItemDto[];
}

export class AiLogEntryDto {
  @ApiPropertyOptional({ description: '记录ID' })
  id?: number;

  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiPropertyOptional({ description: '用户ID' })
  userId?: number;

  @ApiProperty({ description: 'AI模式', enum: AiMode })
  mode: AiMode;

  @ApiProperty({ description: '分析类型' })
  analysisType: string;

  @ApiProperty({ description: '输入Token数' })
  inputTokens: number;

  @ApiProperty({ description: '输出Token数' })
  outputTokens: number;

  @ApiProperty({ description: '总Token数' })
  totalTokens: number;

  @ApiProperty({ description: '耗时（毫秒）' })
  costTime: number;

  @ApiProperty({ description: '状态', enum: ['success', 'failed'] })
  status: 'success' | 'failed';

  @ApiPropertyOptional({ description: '错误信息' })
  errorMsg?: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createTime?: Date;
}

export class CacheOptionsDto {
  @ApiProperty({ description: '缓存过期时间（秒）' })
  ttlSeconds: number;

  @ApiProperty({ description: '缓存键前缀' })
  keyPrefix: string;
}

// 常量
export const DEFAULT_CACHE_TTL = 600;
export const LONG_CACHE_TTL = 86400;

export const CACHE_KEYS = {
  AI_QUERY: 'ai:query',
  AI_RESULT: 'ai:result',
  AI_STATS: 'ai:stats',
  AI_SQL: 'ai:sql',
};

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiMode } from '../interfaces/ai.interfaces';

export class AiAnalysisResultEntity {
  @ApiProperty({ description: '记录ID' })
  id!: bigint;

  @ApiProperty({ description: '项目ID' })
  projectId!: bigint;

  @ApiProperty({ description: '分析类型' })
  analysisType!: string;

  @ApiProperty({ description: '分析数据', type: 'object' })
  analysisData!: Record<string, any>;

  @ApiPropertyOptional({ description: 'SQL日志' })
  sqlLog?: string;

  @ApiProperty({ description: '创建时间' })
  createTime!: Date;
}

export class AiQueryHistoryEntity {
  @ApiProperty({ description: '记录ID' })
  id!: bigint;

  @ApiProperty({ description: '项目ID' })
  projectId!: bigint;

  @ApiPropertyOptional({ description: '用户ID' })
  userId?: bigint;

  @ApiProperty({ description: 'AI模式', enum: AiMode })
  mode!: AiMode;

  @ApiProperty({ description: '分析类型' })
  analysisType!: string;

  @ApiProperty({ description: '输入Token数' })
  inputTokens!: number;

  @ApiProperty({ description: '输出Token数' })
  outputTokens!: number;

  @ApiProperty({ description: '总Token数' })
  totalTokens!: number;

  @ApiProperty({ description: '耗时（毫秒）' })
  costTime!: number;

  @ApiProperty({ description: '状态', enum: ['success', 'failed'] })
  status!: 'success' | 'failed';

  @ApiPropertyOptional({ description: '错误信息' })
  errorMsg?: string;

  @ApiProperty({ description: '创建时间' })
  createTime!: Date;
}

import { ArrayMaxSize, IsArray, IsOptional, IsObject, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CollectBatchDto {
  @ApiProperty({ example: 'proj_123456', description: '项目 ID' })
  @IsString()
  projectId!: string;

  @ApiPropertyOptional({ example: 'batch_20260422_xxxx', description: '请求唯一 ID' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    maxItems: 100,
    description: '埋点数据数组',
  })
  @IsArray()
  @ArrayMaxSize(100)
  data!: Record<string, unknown>[];
}

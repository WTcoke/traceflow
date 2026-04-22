import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectEventDto } from './collect-event.dto';

export class CollectBatchDto {
  @ApiProperty({ example: 'proj_123456', description: '项目 ID' })
  @IsString()
  projectId!: string;

  @ApiPropertyOptional({ example: 'batch_20260422_xxxx', description: '请求唯一 ID' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiProperty({ type: [CollectEventDto], maxItems: 100, description: '埋点数据数组' })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CollectEventDto)
  data!: CollectEventDto[];
}

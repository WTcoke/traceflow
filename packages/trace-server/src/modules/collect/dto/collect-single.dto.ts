import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CollectSingleDto {
  @ApiProperty({ example: 'proj_123456', description: '项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ type: 'object', description: '单条埋点数据' })
  @IsObject()
  data!: Record<string, unknown>;
}

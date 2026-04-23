import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollectEventDto } from './collect-event.dto';

export class CollectSingleDto {
  @ApiProperty({ example: 'proj_123456', description: '项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ type: CollectEventDto, description: '单条埋点数据' })
  @ValidateNested()
  @Type(() => CollectEventDto)
  data!: CollectEventDto;
}

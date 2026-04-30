import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AlarmRecordQueryDto {
  @ApiProperty({ description: '项目ID', example: 1 })
  @IsNotEmpty({ message: '项目ID不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: '项目ID必须是数字' })
  projectId: number;

  @ApiProperty({ description: '状态：0-未处理 1-已处理 2-已关闭', example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;

  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  pageNum?: number;

  @ApiProperty({ description: '每页数量', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  pageSize?: number;
}

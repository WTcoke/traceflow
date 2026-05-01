import { IsNotEmpty, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorListQueryDto {
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

  @ApiPropertyOptional({
    description: '错误类型',
    enum: ['js', 'resource', 'network'],
    example: 'js',
  })
  @IsOptional()
  @IsString()
  @IsIn(['js', 'resource', 'network'], { message: 'errorType 只能是 js/resource/network' })
  errorType?: string;

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'pageNum 必须是数字' })
  pageNum?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize 必须是数字' })
  pageSize?: number = 10;
}

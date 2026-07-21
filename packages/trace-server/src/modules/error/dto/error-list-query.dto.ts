import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ErrorListQueryDto {
  @ApiProperty({ description: '项目 ID', example: 1 })
  @IsNotEmpty({ message: 'projectId 不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'projectId 必须是数字' })
  @IsPositive({ message: 'projectId 必须大于 0' })
  projectId: number;

  @ApiProperty({ description: '开始时间（毫秒时间戳）', example: 1699200000000 })
  @IsNotEmpty({ message: 'startTime 不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'startTime 必须是数字' })
  @IsPositive({ message: 'startTime 必须大于 0' })
  startTime: number;

  @ApiProperty({ description: '结束时间（毫秒时间戳）', example: 1699286400000 })
  @IsNotEmpty({ message: 'endTime 不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'endTime 必须是数字' })
  @IsPositive({ message: 'endTime 必须大于 0' })
  endTime: number;

  @ApiPropertyOptional({ description: '错误类型', example: 'TypeError' })
  @IsOptional()
  @IsString({ message: 'errorType 必须是字符串' })
  errorType?: string;

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

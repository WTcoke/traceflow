import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BehaviorPathsQueryDto {
  @ApiProperty({ description: '项目ID', example: 1 })
  @IsNotEmpty({ message: 'projectId 必填' })
  @Type(() => Number)
  @IsNumber({}, { message: 'projectId 必须是数字' })
  projectId: number;

  @ApiPropertyOptional({ description: '设备ID（与 userId 二选一）', example: 'device_abc123' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: '用户ID（与 deviceId 二选一）', example: 'user_789' })
  @IsOptional()
  @IsString()
  userId?: string;

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

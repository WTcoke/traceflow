import {
  IsString,
  IsDefined,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceInfoDto {
  @ApiProperty({ description: '设备平台', example: 'web' })
  @IsString()
  platform!: string;

  @ApiProperty({ description: '设备ID', example: 'device-123' })
  @IsString()
  deviceId!: string;
}

export class TraceEventDto {
  @ApiProperty({ description: '事件ID', example: 'event-123' })
  @IsString()
  eventId!: string;

  @ApiProperty({
    description: '事件类型',
    enum: ['track', 'page', 'error', 'identify'],
    example: 'track',
  })
  @IsString()
  @IsIn(['track', 'page', 'error', 'identify'])
  eventType!: string;

  @ApiProperty({ description: '事件时间戳', example: 1776952673930 })
  @IsNumber()
  timestamp!: number;

  @ApiProperty({ description: '用户ID', example: 'user-123', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: '匿名ID', example: 'anon-123' })
  @IsString()
  anonymousId!: string;

  @ApiProperty({ description: '会话ID', example: 'sess-123' })
  @IsString()
  sessionId!: string;

  @ApiProperty({ description: '设备信息' })
  @IsDefined()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo!: DeviceInfoDto;

  @ApiProperty({
    description: '事件属性',
    example: { event: 'click', url: 'https://example.com' },
    required: false,
  })
  @IsOptional()
  properties?: Record<string, any>;

  @ApiProperty({ description: '创建时间戳', example: 1776952673930 })
  @IsNumber()
  _createdAt!: number;

  @ApiProperty({
    description: '事件优先级',
    enum: ['critical', 'normal'],
    example: 'normal',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['critical', 'normal'])
  priority?: string;
}

export class SingleCollectDto {
  @ApiProperty({ description: '项目ID', example: 'project-123' })
  @IsString()
  projectId!: string;

  @ApiProperty({ description: '事件数据' })
  @IsDefined()
  @ValidateNested()
  @Type(() => TraceEventDto)
  data!: TraceEventDto;
}

export class BatchCollectDto {
  @ApiProperty({ description: '项目ID', example: 'project-123' })
  @IsString()
  projectId!: string;

  @ApiProperty({ description: '请求ID', example: 'batch-123' })
  @IsString()
  requestId!: string;

  @ApiProperty({ description: '事件数据列表', type: [TraceEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TraceEventDto)
  data!: TraceEventDto[];
}

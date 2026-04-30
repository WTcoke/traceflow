import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const COLLECT_EVENT_TYPES = ['track', 'page', 'error', 'identify', 'custom'] as const;
const PRIORITIES = ['critical', 'normal', 'low'] as const;

export class DeviceInfoDto {
  @ApiProperty({ example: 'Chrome', description: '浏览器名称' })
  @IsString()
  browser?: string;

  @ApiProperty({ example: '120.0.0.0', description: '浏览器版本' })
  @IsString()
  browserVersion?: string;

  @ApiProperty({ example: 'Windows', description: '操作系统' })
  @IsString()
  os?: string;

  @ApiProperty({ example: '10', description: '操作系统版本' })
  @IsString()
  osVersion?: string;

  @ApiProperty({ example: 'desktop', description: '设备类型' })
  @IsString()
  deviceType?: string;

  @ApiProperty({ example: 'zh-CN', description: '语言' })
  @IsString()
  language?: string;

  @ApiProperty({ example: 'Asia/Shanghai', description: '时区' })
  @IsString()
  timezone?: string;
}

export class CollectEventDto {
  @ApiProperty({ example: 'evt_xxxx', description: '事件唯一 ID' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ enum: COLLECT_EVENT_TYPES, example: 'page', description: '事件类型' })
  @IsEnum(COLLECT_EVENT_TYPES)
  eventType!: (typeof COLLECT_EVENT_TYPES)[number];

  @ApiPropertyOptional({ example: 'page_view', description: '事件名称' })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiProperty({ example: 1744000000000, description: '事件时间戳' })
  @IsNumber()
  @Min(0)
  timestamp!: number;

  @ApiPropertyOptional({ example: 'user_xxxx', description: '用户 ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'anon_xxxx', description: '匿名用户 ID' })
  @IsString()
  @IsNotEmpty()
  anonymousId!: string;

  @ApiProperty({ example: 'sess_xxxx', description: '会话 ID' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({ type: DeviceInfoDto, description: '设备信息' })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo!: DeviceInfoDto;

  @ApiPropertyOptional({ example: 'https://example.com/home', description: '页面 URL' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ example: '首页', description: '页面标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'https://example.com', description: '来源页面' })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional({ example: { key: 'value' }, description: '扩展属性' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: PRIORITIES, example: 'normal', description: '事件优先级' })
  @IsOptional()
  @IsEnum(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];
}

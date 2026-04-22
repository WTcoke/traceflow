import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PLATFORMS = [
  'web',
  'miniapp-weixin',
  'miniapp-alipay',
  'miniapp-baidu',
  'miniapp-toutiao',
  'nodejs',
] as const;

export const EVENT_TYPES = ['track', 'page', 'error', 'identify', 'custom'] as const;

export const PRIORITIES = ['critical', 'normal', 'low'] as const;

export class DeviceInfoDto {
  @ApiProperty({ description: '设备唯一标识ID', example: 'device-001-xxx' })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({
    description: '平台类型',
    enum: PLATFORMS,
    example: 'web',
  })
  @IsEnum(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @ApiPropertyOptional({ description: 'User-Agent', example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: '屏幕宽度', example: 1920 })
  @IsOptional()
  @IsInt()
  @Min(0)
  screenWidth?: number;

  @ApiPropertyOptional({ description: '屏幕高度', example: 1080 })
  @IsOptional()
  @IsInt()
  @Min(0)
  screenHeight?: number;

  @ApiPropertyOptional({ description: '操作系统', example: 'Windows' })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiPropertyOptional({ description: '操作系统版本', example: '10' })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({ description: '浏览器', example: 'Chrome' })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiPropertyOptional({ description: '浏览器版本', example: '120.0' })
  @IsOptional()
  @IsString()
  browserVersion?: string;

  @ApiPropertyOptional({ description: '语言', example: 'zh-CN' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: '时区', example: 'Asia/Shanghai' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: '网络类型', example: 'WiFi' })
  @IsOptional()
  @IsString()
  networkType?: string;

  @ApiPropertyOptional({ description: 'App版本', example: '1.0.0' })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({ description: 'SDK版本', example: '1.0.0' })
  @IsOptional()
  @IsString()
  sdkVersion?: string;

  @ApiPropertyOptional({ description: '渠道来源', example: 'App Store' })
  @IsOptional()
  @IsString()
  channel?: string;

  [key: string]: unknown;
}

export class CreateTrackDto {
  @ApiProperty({
    description: '客户端生成的唯一事件ID(UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({
    description: '事件类型',
    enum: EVENT_TYPES,
    example: 'track',
  })
  @IsEnum(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @ApiPropertyOptional({ description: '自定义事件名称', example: 'button_click' })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiProperty({ description: '事件发生时间戳(毫秒)', example: 1713001234567 })
  @IsNumber()
  @Min(0)
  timestamp!: number;

  @ApiPropertyOptional({ description: '登录用户ID', example: 'user-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: '匿名用户ID', example: 'anon-456' })
  @IsString()
  @IsNotEmpty()
  anonymousId!: string;

  @ApiProperty({ description: '会话ID', example: 'sess-789' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({ description: '设备信息', type: DeviceInfoDto })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo!: DeviceInfoDto;

  @ApiPropertyOptional({ description: '页面URL', example: 'https://example.com/page' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: '页面标题', example: '首页' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '来源页面', example: 'https://google.com' })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional({ description: '自定义属性', example: { key: 'value' } })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '事件优先级',
    enum: PRIORITIES,
    example: 'normal',
  })
  @IsOptional()
  @IsEnum(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];
}

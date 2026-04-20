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
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsEnum(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  screenWidth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  screenHeight?: number;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  browserVersion?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  networkType?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  sdkVersion?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  [key: string]: unknown;
}

export class CreateTrackDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsEnum(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @IsString()
  eventName?: string;

  @IsNumber()
  @Min(0)
  timestamp!: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  anonymousId!: string;

  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo!: DeviceInfoDto;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== 枚举定义（仅用于提示，不强校验）====================
export const VALID_PLATFORMS = ['web', 'ios', 'android', 'miniapp', 'pc', 'h5'] as const;
export type Platform = (typeof VALID_PLATFORMS)[number] | string; // 允许 string 兼容扩展

export const VALID_EVENT_TYPES = ['behavior', 'performance', 'error'] as const;
export type EventType = (typeof VALID_EVENT_TYPES)[number] | string;

// ==================== 工具常量 ====================
const ONE_DAY_MS = 86400000;
const NOW = Date.now();

/// ========== 单个事件 DTO ==========
export class BuriedPointEventDto {
  @ApiProperty({ description: '消息ID', example: 'msg_123456' })
  msgId!: string;

  @ApiProperty({ description: '设备ID', example: 'device_abc123' })
  deviceId!: string;

  @ApiPropertyOptional({ description: '用户ID', example: 'user_789' })
  userId?: string;

  @ApiProperty({ description: '事件时间戳(ms)', example: 1714147200000 })
  eventTime!: number;

  @ApiProperty({
    description: '事件类型',
    enum: VALID_EVENT_TYPES,
    example: 'behavior',
  })
  eventType!: EventType;

  @ApiProperty({
    description: '平台',
    enum: VALID_PLATFORMS,
    example: 'web',
  })
  platform!: Platform;

  @ApiPropertyOptional({ description: '用户代理', example: 'Mozilla/5.0 ...' })
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP地址', example: '192.168.1.1' })
  ip?: string;

  @ApiPropertyOptional({ description: '操作系统', example: 'Windows 10' })
  os?: string;

  @ApiPropertyOptional({ description: '浏览器', example: 'Chrome 120' })
  browser?: string;

  @ApiPropertyOptional({ description: '国家', example: '中国' })
  country?: string;

  @ApiPropertyOptional({ description: '省份', example: '广东省' })
  province?: string;

  @ApiPropertyOptional({ description: '城市', example: '深圳市' })
  city?: string;

  @ApiPropertyOptional({ description: '业务数据（JSON格式）', type: 'object' })
  data?: Record<string, any>;
}

// ========== 统一埋点 DTO（支持单条与批量）==========
export class BuriedPointDto {
  @ApiProperty({ description: '应用ID', example: 'app_abc123' })
  appId!: string;

  @ApiProperty({
    description: '事件列表（1-100条）',
    type: [BuriedPointEventDto],
    example: [
      {
        msgId: 'msg_123',
        deviceId: 'dev_456',
        eventTime: 1714147200000,
        eventType: 'behavior',
        platform: 'web',
      },
    ],
  })
  events!: BuriedPointEventDto[];
}

// ========== 清洗后的埋点数据类型（复用 BuriedPointEventDto）==========
export type CleanedBuriedPointData = BuriedPointEventDto;

// ==================== AJV Schema（与DTO完全对齐）====================
export const buriedPointEventSchema = {
  type: 'object',
  required: ['msgId', 'deviceId', 'eventTime', 'eventType', 'platform'],
  properties: {
    msgId: { type: 'string', minLength: 1, maxLength: 64 },
    deviceId: { type: 'string', minLength: 1, maxLength: 128 },
    userId: { type: 'string', maxLength: 64, nullable: true },
    eventTime: { type: 'integer', minimum: 1704067200000, maximum: NOW + 30 * ONE_DAY_MS },
    eventType: { type: 'string', minLength: 1, maxLength: 32 },
    platform: { type: 'string', minLength: 1, maxLength: 32 },
    userAgent: { type: 'string', maxLength: 512, nullable: true },
    ip: { type: 'string', maxLength: 45, nullable: true },
    os: { type: 'string', maxLength: 50, nullable: true },
    browser: { type: 'string', maxLength: 50, nullable: true },
    country: { type: 'string', maxLength: 50, nullable: true },
    province: { type: 'string', maxLength: 50, nullable: true },
    city: { type: 'string', maxLength: 50, nullable: true },
    data: { type: 'object', nullable: true },
  },
};

export const buriedPointSchema = {
  type: 'object',
  required: ['appId', 'events'],
  properties: {
    appId: { type: 'string', minLength: 1, maxLength: 64 },
    events: {
      type: 'array',
      minItems: 1,
      maxItems: 100,
      items: buriedPointEventSchema,
    },
  },
};

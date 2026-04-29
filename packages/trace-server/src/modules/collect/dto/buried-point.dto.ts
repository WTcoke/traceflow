import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 单条埋点数据DTO
 */
export class SingleBuriedPointDto {
  @ApiProperty({ description: '消息ID，必填', example: 'msg_123456' })
  msgId!: string;

  @ApiProperty({ description: '设备ID', example: 'device_abc123' })
  deviceId!: string;

  @ApiPropertyOptional({ description: '用户ID', example: 'user_789' })
  userId?: string;

  @ApiProperty({ description: '事件时间（毫秒时间戳）', example: 1714147200000 })
  eventTime!: number;

  @ApiProperty({
    description: '事件类型',
    enum: ['behavior', 'performance', 'error'],
    example: 'behavior',
  })
  eventType!: 'behavior' | 'performance' | 'error';

  @ApiProperty({ description: '平台', example: 'web' })
  platform!: string;

  @ApiPropertyOptional({ description: '用户代理' })
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP地址' })
  ip?: string;

  @ApiPropertyOptional({ description: '操作系统' })
  os?: string;

  @ApiPropertyOptional({ description: '浏览器' })
  browser?: string;

  @ApiPropertyOptional({ description: '国家' })
  country?: string;

  @ApiPropertyOptional({ description: '省份' })
  province?: string;

  @ApiPropertyOptional({ description: '城市' })
  city?: string;

  @ApiProperty({ description: '业务数据（JSON）', type: 'object' })
  data!: Record<string, any>;
}

/**
 * 批量埋点数据DTO
 */
export class BatchBuriedPointDto {
  @ApiProperty({ description: '埋点数据列表', type: [SingleBuriedPointDto] })
  list!: SingleBuriedPointDto[];
}

/**
 * 埋点数据验证Schema（用于AJV验证）
 */
export const buriedPointSchema = {
  type: 'object',
  required: ['msgId', 'deviceId', 'eventTime', 'eventType', 'platform', 'data'],
  properties: {
    msgId: { type: 'string', minLength: 1, maxLength: 64 },
    deviceId: { type: 'string', minLength: 1, maxLength: 128 },
    userId: { type: 'string', maxLength: 64, nullable: true },
    eventTime: { type: 'integer', minimum: 1 },
    eventType: { type: 'string', enum: ['behavior', 'performance', 'error'] },
    platform: { type: 'string', minLength: 1, maxLength: 20 },
    userAgent: { type: 'string', nullable: true },
    ip: { type: 'string', maxLength: 45, nullable: true },
    os: { type: 'string', maxLength: 50, nullable: true },
    browser: { type: 'string', maxLength: 50, nullable: true },
    country: { type: 'string', maxLength: 50, nullable: true },
    province: { type: 'string', maxLength: 50, nullable: true },
    city: { type: 'string', maxLength: 50, nullable: true },
    data: { type: 'object' },
  },
};

import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectDto {
  @ApiProperty({
    description: '事件名称',
    example: 'page_view',
  })
  eventName: string = '';

  @ApiProperty({
    description: '事件发生时间戳',
    example: Date.now(),
  })
  timestamp: number = Date.now();

  @ApiProperty({
    description: '用户ID',
    example: 'user_123',
    required: false,
  })
  userId?: string;

  @ApiProperty({
    description: '会话ID',
    example: 'session_456',
    required: false,
  })
  sessionId?: string;

  @ApiProperty({
    description: '事件属性',
    example: { page: '/home', referrer: 'https://example.com' },
    required: false,
    type: Object,
  })
  properties?: Record<string, any>;

  @ApiProperty({
    description: '设备信息',
    example: { browser: 'Chrome', os: 'Windows' },
    required: false,
    type: Object,
  })
  deviceInfo?: Record<string, any>;

  @ApiProperty({
    description: '应用版本',
    example: '1.0.0',
    required: false,
  })
  appVersion?: string;

  @ApiProperty({
    description: '平台',
    example: 'web',
    required: false,
  })
  platform?: string;
}

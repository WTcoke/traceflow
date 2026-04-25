import { ApiProperty } from '@nestjs/swagger';

// 事件数据类型
export interface TraceEvent {
  eventName: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
  deviceInfo?: Record<string, unknown>;
  appVersion?: string;
  platform?: string;
  [key: string]: unknown;
}

export class BatchCollectDto {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
  })
  projectId: string = '';

  @ApiProperty({
    description: '请求ID',
    example: 'batch_1234567890_abcdef',
  })
  requestId: string = '';

  @ApiProperty({
    description: '事件数组',
    type: Array,
  })
  data: TraceEvent[] = [];
}

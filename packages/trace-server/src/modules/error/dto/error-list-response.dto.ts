import { ApiProperty } from '@nestjs/swagger';

export class ErrorItemDto {
  @ApiProperty({ description: '错误ID', example: '123456' })
  id: string;

  @ApiProperty({ description: '错误类型', example: 'TypeError' })
  errorType: string;

  @ApiProperty({ description: '错误消息', example: 'Cannot read property of undefined' })
  message: string;

  @ApiProperty({ description: '页面URL', example: '/home' })
  pageUrl: string;

  @ApiProperty({ description: '设备ID', example: 'device123' })
  deviceId: string;

  @ApiProperty({ description: '发生时间（毫秒时间戳）', example: 1714147210000 })
  eventTime: number;

  @ApiProperty({ description: '堆栈信息', example: 'at ...' })
  stack: string;
}

export class ErrorListResponseDto {
  @ApiProperty({ description: '总数', example: 50 })
  total: number;

  @ApiProperty({ description: '总页数', example: 5 })
  pages: number;

  @ApiProperty({ description: '错误列表', type: [ErrorItemDto] })
  list: ErrorItemDto[];
}

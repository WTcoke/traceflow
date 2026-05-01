import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorItemDto {
  @ApiProperty({ description: '错误ID', example: '1734567890123456' })
  id: string;

  @ApiProperty({ description: '事件类型', example: 'error' })
  eventType: string;

  @ApiProperty({ description: '错误类型', example: 'js' })
  errorType: string;

  @ApiProperty({ description: '错误信息', example: 'TypeError: Cannot read property...' })
  message: string;

  @ApiPropertyOptional({ description: '错误堆栈' })
  stack?: string;

  @ApiProperty({ description: '页面URL', example: '/home' })
  pageUrl: string;

  @ApiProperty({ description: '事件时间（毫秒时间戳）', example: 1714147200000 })
  eventTime: number;

  @ApiPropertyOptional({ description: '操作系统', example: 'Windows' })
  os?: string;

  @ApiPropertyOptional({ description: '浏览器', example: 'Chrome 120' })
  browser?: string;
}

export class ErrorListResponseDto {
  @ApiProperty({ description: '总数', example: 200 })
  total: number;

  @ApiProperty({ description: '总页数', example: 20 })
  pages: number;

  @ApiProperty({ description: '错误列表', type: [ErrorItemDto] })
  list: ErrorItemDto[];
}

import { ApiProperty } from '@nestjs/swagger';

export class BehaviorPathItemDto {
  @ApiProperty({ description: '页面URL', example: '/home' })
  pageUrl: string;

  @ApiProperty({ description: '事件名称', example: 'click' })
  eventName: string;

  @ApiProperty({ description: '元素选择器', example: '#menu' })
  element: string;

  @ApiProperty({ description: '事件时间（毫秒时间戳）', example: 1714147210000 })
  eventTime: number;
}

export class BehaviorPathsResponseDto {
  @ApiProperty({ description: '总数', example: 50 })
  total: number;

  @ApiProperty({ description: '总页数', example: 5 })
  pages: number;

  @ApiProperty({ description: '行为路径列表', type: [BehaviorPathItemDto] })
  list: BehaviorPathItemDto[];
}

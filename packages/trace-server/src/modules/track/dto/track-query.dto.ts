import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TrackQueryDto {
  @ApiPropertyOptional({
    description: 'ID类型：eventId(客户端生成的UUID) 或 dbId(数据库自增ID)',
    enum: ['eventId', 'dbId'],
    default: 'eventId',
  })
  @IsOptional()
  @IsEnum(['eventId', 'dbId'])
  idType?: 'eventId' | 'dbId' = 'eventId';
}

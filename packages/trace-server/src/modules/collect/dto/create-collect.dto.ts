import { ApiProperty } from '@nestjs/swagger';
import { TraceEvent } from './batch-collect.dto';

export class CreateCollectDto {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
  })
  projectId: string = '';

  @ApiProperty({
    description: '事件数据',
    type: Object,
  })
  data: TraceEvent = {} as TraceEvent;
}

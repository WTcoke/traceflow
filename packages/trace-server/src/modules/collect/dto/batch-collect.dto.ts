import { ApiProperty } from '@nestjs/swagger';
import { CreateCollectDto } from './create-collect.dto';

export class BatchCollectDto {
  @ApiProperty({
    description: '事件数组',
    type: [CreateCollectDto],
  })
  events: CreateCollectDto[] = [];
}

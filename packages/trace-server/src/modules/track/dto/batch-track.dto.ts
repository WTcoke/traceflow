import { Type } from 'class-transformer';
import { IsArray, ArrayMaxSize, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTrackDto } from './create-track.dto';

export class BatchTrackDto {
  @ApiProperty({
    description: '事件数组，最多100条',
    type: [CreateTrackDto],
    maxItems: 100,
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateTrackDto)
  events!: CreateTrackDto[];
}

import { Type } from 'class-transformer';
import { IsArray, ArrayMaxSize, ValidateNested } from 'class-validator';
import { CreateTrackDto } from './create-track.dto';

export class BatchTrackDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateTrackDto)
  events!: CreateTrackDto[];
}

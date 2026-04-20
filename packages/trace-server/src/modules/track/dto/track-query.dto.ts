import { IsOptional, IsEnum } from 'class-validator';

export class TrackQueryDto {
  @IsOptional()
  @IsEnum(['eventId', 'dbId'])
  idType?: 'eventId' | 'dbId' = 'eventId';
}

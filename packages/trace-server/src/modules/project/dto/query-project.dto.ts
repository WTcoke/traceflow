import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProjectDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageNum?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

  @IsString()
  @IsOptional()
  keyword?: string;
}

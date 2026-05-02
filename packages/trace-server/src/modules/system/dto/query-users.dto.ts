import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUsersDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageNum?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  status?: number;

  @IsString()
  @IsOptional()
  keyword?: string;
}

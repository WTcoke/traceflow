import { IsString, IsOptional, MaxLength, IsObject, IsInt } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '项目名称最多100个字符' })
  projectName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '项目描述最多500个字符' })
  description?: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @IsInt()
  @IsOptional()
  status?: number;
}

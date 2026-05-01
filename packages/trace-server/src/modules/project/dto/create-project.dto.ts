import { IsString, IsNotEmpty, IsOptional, MaxLength, IsObject } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: '项目名称不能为空' })
  @MaxLength(100, { message: '项目名称最多100个字符' })
  projectName: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '项目描述最多500个字符' })
  description?: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

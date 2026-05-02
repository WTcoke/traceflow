import { IsString, IsOptional, IsInt, MaxLength, IsPhoneNumber } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: '姓名最多50个字符' })
  name?: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber('CN', { message: '手机号格式不正确' })
  phone?: string;

  @IsInt()
  @IsOptional()
  status?: number;

  @IsInt()
  @IsOptional()
  roleId?: number;
}

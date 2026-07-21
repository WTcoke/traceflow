import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MaxLength(50, { message: '用户名最多50个字符' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码最少6位' })
  password: string;

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
  status?: number = 1;

  @IsInt()
  @IsNotEmpty({ message: '角色ID不能为空' })
  roleId: number;
}

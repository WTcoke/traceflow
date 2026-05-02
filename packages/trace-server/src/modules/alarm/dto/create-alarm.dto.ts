import { IsNotEmpty, IsString, IsNumber, IsOptional, IsJSON, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlarmRuleDto {
  @ApiProperty({ description: '项目ID', example: 1 })
  @IsNotEmpty({ message: '项目ID不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: '项目ID必须是数字' })
  projectId: number;

  @ApiProperty({ description: '规则名称', example: 'JS错误告警' })
  @IsNotEmpty({ message: '规则名称不能为空' })
  @IsString({ message: '规则名称必须是字符串' })
  ruleName: string;

  @ApiProperty({ description: '告警类型', example: 'error' })
  @IsNotEmpty({ message: '告警类型不能为空' })
  @IsString({ message: '告警类型必须是字符串' })
  alarmType: string;

  @ApiProperty({ description: '阈值配置', example: { maxCount: 100, duration: 5 } })
  @IsNotEmpty({ message: '阈值配置不能为空' })
  @IsObject({ message: '阈值配置必须是对象' })
  threshold: object;

  @ApiProperty({ description: '接收人配置', example: ['admin@example.com'] })
  @IsNotEmpty({ message: '接收人不能为空' })
  receivers: string[];

  @ApiProperty({ description: '状态：1-启用 0-禁用', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;
}

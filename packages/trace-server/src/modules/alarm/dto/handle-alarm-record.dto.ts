import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class HandleAlarmRecordDto {
  @ApiProperty({ description: '处理状态：1-已处理 2-已关闭', example: 1 })
  @IsNotEmpty({ message: '状态不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: '状态必须是数字' })
  status: number;

  @ApiProperty({ description: '处理备注', example: '已修复该异常', required: false })
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  remark?: string;
}

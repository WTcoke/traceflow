import { ApiProperty } from '@nestjs/swagger';

export class AlarmRuleEntity {
  @ApiProperty({ description: '规则ID' })
  id: number;

  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiProperty({ description: '规则名称' })
  ruleName: string;

  @ApiProperty({ description: '告警类型' })
  alarmType: string;

  @ApiProperty({ description: '阈值配置' })
  threshold: object;

  @ApiProperty({ description: '接收人配置' })
  receivers: string[];

  @ApiProperty({ description: '状态：1-启用 0-禁用' })
  status: number;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;
}

export class AlarmRecordEntity {
  @ApiProperty({ description: '记录ID' })
  id: number;

  @ApiProperty({ description: '规则ID' })
  ruleId: number;

  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiProperty({ description: '告警内容' })
  alarmContent: string;

  @ApiProperty({ description: '告警级别' })
  alarmLevel: string;

  @ApiProperty({ description: '状态：0-未处理 1-已处理 2-已关闭' })
  status: number;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;
}

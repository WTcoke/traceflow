import { PartialType } from '@nestjs/swagger';
import { CreateAlarmRuleDto } from './create-alarm.dto';

export class UpdateAlarmRuleDto extends PartialType(CreateAlarmRuleDto) {}

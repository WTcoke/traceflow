import { PartialType } from '@nestjs/swagger';
import { CreateAlarmDto } from './create-alarm.dto';

export class UpdateAlarmRuleDto extends PartialType(CreateAlarmRuleDto) {}

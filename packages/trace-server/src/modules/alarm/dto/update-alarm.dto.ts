import { PartialType } from '@nestjs/mapped-types';
import { CreateAlarmRuleDto } from '../dto/create-alarm.dto';

export class UpdateAlarmRuleDto extends PartialType(CreateAlarmRuleDto) {}

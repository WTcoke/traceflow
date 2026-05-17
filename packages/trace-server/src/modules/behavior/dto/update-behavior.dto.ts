import { PartialType } from '@nestjs/swagger';
import { CreateBehaviorDto } from './create-behavior.dto';

export class UpdateBehaviorDto extends PartialType(CreateBehaviorDto) {}

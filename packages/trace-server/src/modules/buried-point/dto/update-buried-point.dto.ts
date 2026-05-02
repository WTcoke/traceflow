import { PartialType } from '@nestjs/swagger';
import { CreateBuriedPointDto } from './create-buried-point.dto';

export class UpdateBuriedPointDto extends PartialType(CreateBuriedPointDto) {}

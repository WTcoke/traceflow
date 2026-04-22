import { PartialType } from '@nestjs/mapped-types';
import { CreateBuriedPointDto } from './create-buried-point.dto';

export class UpdateBuriedPointDto extends PartialType(CreateBuriedPointDto) {}

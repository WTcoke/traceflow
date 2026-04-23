import { Module } from '@nestjs/common';
import { BuriedPointService } from './buried-point.service';
import { BuriedPointController } from './buried-point.controller';

@Module({
  controllers: [BuriedPointController],
  providers: [BuriedPointService],
})
export class BuriedPointModule {}

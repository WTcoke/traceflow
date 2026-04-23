import { Module } from '@nestjs/common';
import { BehaviorService } from './behavior.service';
import { BehaviorController } from './behavior.controller';

@Module({
  controllers: [BehaviorController],
  providers: [BehaviorService],
})
export class BehaviorModule {}

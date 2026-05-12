import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { RedisModule } from '../../../core/redis/redis.module';
import { BehaviorService } from './behavior.service';
import { BehaviorController } from '../contollers/behavior.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [BehaviorController],
  providers: [BehaviorService],
})
export class BehaviorModule {}

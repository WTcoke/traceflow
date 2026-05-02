import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BehaviorService } from './behavior.service';
import { BehaviorController } from './behavior.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BehaviorController],
  providers: [BehaviorService],
})
export class BehaviorModule {}
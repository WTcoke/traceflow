import { Module } from '@nestjs/common';
import { AlarmService } from '../services/alarm.service';
import { AlarmController } from '../controllers/alarm.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlarmController],
  providers: [AlarmService],
})
export class AlarmModule {}

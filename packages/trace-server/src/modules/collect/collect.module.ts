import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';

@Module({
  imports: [PrismaModule],
  controllers: [CollectController],
  providers: [CollectService],
})
export class CollectModule {}

import { Module } from '@nestjs/common';
import { TrackModule } from './modules/track/track.module';
import { PrismaModule } from './prisma/prisma.module';
import { CollectModule } from './modules/collect/collect.module';

@Module({
  imports: [PrismaModule, TrackModule, CollectModule],
})
export class AppModule {}

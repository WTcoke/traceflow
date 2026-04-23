import { Module } from '@nestjs/common';
import { TrackModule } from './modules/track/track.module';
import { CollectModule } from './modules/collect/collect.module';
import { PrismaModule } from './core/prisma/prisma.module';

@Module({
  imports: [PrismaModule, TrackModule, CollectModule],
})
export class AppModule {}

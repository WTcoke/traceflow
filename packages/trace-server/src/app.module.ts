import { Module } from '@nestjs/common';
import { TrackModule } from './modules/track/track.module';
import { PrismaModule } from './core/prisma/prisma.module';

@Module({
  imports: [PrismaModule, TrackModule],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TrackModule } from '../track/track.module';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';

@Module({
  imports: [TrackModule],
  controllers: [CollectController],
  providers: [CollectService],
})
export class CollectModule {}

import { Module } from '@nestjs/common';
import { TrackModule } from '../track/track.module';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';

@Module({
imports: [TrackModule],
import { CollectService } from './collect.service';
import { CollectController } from './collect.controller';

@Module({
  controllers: [CollectController],
  providers: [CollectService],
})
export class CollectModule {}

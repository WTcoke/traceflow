import { Module } from '@nestjs/common';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';
@Module({
  imports: [],
  controllers: [CollectController],
  providers: [CollectService],
})
export class CollectModule {}

import { Module } from '@nestjs/common';
import { CollectService } from './collect.service';
import { CollectController } from './collect.controller';
import { IpService } from '../ip/ip.service';

@Module({
  controllers: [CollectController],
  providers: [CollectService, IpService],
})
export class CollectModule {}

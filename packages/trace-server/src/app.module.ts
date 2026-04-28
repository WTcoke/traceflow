import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { CollectModule } from './modules/collect/collect.module';
import { IpModule } from './modules/ip/ip.module';
@Module({
  imports: [PrismaModule, CollectModule, IpModule],
})
export class AppModule {}

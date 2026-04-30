import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { CollectModule } from './modules/collect/collect.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CollectModule,
    StatisticsModule,
  ],
})
export class AppModule {}

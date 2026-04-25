import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { CollectModule } from './modules/collect/collect.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, CollectModule],
})
export class AppModule {}

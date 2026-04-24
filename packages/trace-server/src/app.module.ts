import { Module } from '@nestjs/common';
import { CollectModule } from './modules/collect/collect.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, CollectModule],
})
export class AppModule {}

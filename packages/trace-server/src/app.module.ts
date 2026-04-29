import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './core/prisma/prisma.module';
import { CollectModule } from './modules/collect/collect.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
@Module({
  imports: [PrismaModule, CollectModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}

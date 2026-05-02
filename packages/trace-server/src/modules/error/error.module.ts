import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ErrorService } from './error.service';
import { ErrorController } from './error.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ErrorController],
  providers: [ErrorService],
})
export class ErrorModule {}
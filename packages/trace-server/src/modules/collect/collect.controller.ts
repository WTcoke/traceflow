import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CollectService } from './collect.service';
import { BuriedPointDto } from './dto/buried-point.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

const MAX_REQUEST_SIZE = '100kb';
@ApiTags('collect')
@ApiBearerAuth()
@Controller('collect')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectController {
  private readonly logger = new Logger(CollectController.name);

  constructor(private readonly collectService: CollectService) {}

  /**
   * 统一的埋点上报接口（推荐使用）
   * single: { "appId": "...", "events": [event] }
   * batch: { "appId": "...", "events": [event, event, event] }
   */
  @Post()
  @ApiOperation({ summary: '统一埋点上报（推荐）' })
  @Permissions('collect:write')
  async collect(@Body() dto: BuriedPointDto, @Req() req: Request) {
    this.validateContentLength(req);

    const { projectId } = await this.collectService.validateAppId(dto.appId);

    this.collectService.sendToQueue(projectId, dto.events).catch((error) => {
      this.logger.error(`Failed to send events to queue: ${error.message}`);
    });

    return { received: dto.events.length };
  }

  private validateContentLength(req: Request): void {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = this.parseSize(MAX_REQUEST_SIZE);

    if (contentLength > maxBytes) {
      throw new BadRequestException(`Request body size exceeds ${MAX_REQUEST_SIZE}`);
    }
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)\s*(b|kb|mb|gb)?$/);
    if (!match) return 1024 * 100;

    const value = parseInt(match[1], 10);
    const unit = match[2] || 'b';

    return value * (units[unit] || 1);
  }
}

import { Controller, Post, Body, Req, BadRequestException, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CollectService } from './collect.service';
import { BuriedPointDto } from './dto/buried-point.dto';

const MAX_REQUEST_SIZE = '100kb';
@ApiTags('collect')
@Controller('collect')
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

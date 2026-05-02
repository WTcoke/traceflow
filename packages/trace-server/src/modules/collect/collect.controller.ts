import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CollectService } from './collect.service';
import { SingleBuriedPointDto } from './dto/buried-point.dto';

/**
 * 提取客户端真实 IP
 * 优先读取 X-Forwarded-For，其次 request.ip / socket.remoteAddress
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return (req.ip || req.socket?.remoteAddress || '127.0.0.1') as string;
}

@ApiTags('collect')
@Controller('collect')
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  /**
   * 单条埋点上报
   */
  @Post('single')
  @ApiOperation({ summary: '单条埋点上报' })
  async collectSingle(@Body() dto: SingleBuriedPointDto, @Req() req: Request) {
    const clientIp = getClientIp(req);
    // 1. 校验 appId（查 project 表）
    const { projectId } = await this.collectService.validateAppId(dto.appId);
    // 2. 基础校验（字段、归一化、去重、限流）
    await this.collectService.validateReport(dto, clientIp);
    // 3. 入队
    await this.collectService.sendToQueue(projectId, [dto]);
    return { received: 1 };
  }

  /**
   * 批量埋点上报
   * 全量校验：任一条失败则整体 400
   * 批量只查一次 project 表
   */
  @Post('batch')
  @ApiOperation({ summary: '批量埋点上报' })
  async collectBatch(@Body() dtoList: SingleBuriedPointDto[], @Req() req: Request) {
    if (!Array.isArray(dtoList)) {
      throw new BadRequestException('Request body must be an array');
    }
    if (dtoList.length === 0) {
      throw new BadRequestException('Batch array cannot be empty');
    }
    if (dtoList.length > 100) {
      throw new BadRequestException('Batch size must not exceed 100');
    }

    const clientIp = getClientIp(req);

    // 1. 先统一校验 appId（只查一次 project 表）
    const { projectId } = await this.collectService.validateAppId(dtoList[0].appId);

    // 2. 全量基础校验：逐条验证，任一条失败则整体抛错
    for (const dto of dtoList) {
      await this.collectService.validateReport(dto, clientIp);
    }

    // 3. 入队
    await this.collectService.sendToQueue(projectId, dtoList);

    return { received: dtoList.length };
  }
}

import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CollectService } from './collect.service';
import { BatchCollectDto, SingleCollectDto } from './dto/create-collect.dto';
import { IpService } from '../ip/ip.service';

@ApiTags('collect')
@Controller('collect')
export class CollectController {
  constructor(
    private readonly collectService: CollectService,
    private readonly ipService: IpService,
  ) {}

  /**
   * 单条数据上报
   */
  @ApiOperation({ summary: '单条数据上报', description: '接收 SDK 上报的单条埋点事件' })
  @ApiBody({ type: SingleCollectDto })
  @ApiResponse({ status: 200, description: '数据上报成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Post('single')
  createSingle(@Body() singleCollectDto: SingleCollectDto) {
    return this.collectService.createSingle(singleCollectDto);
  }

  /**
   * 批量数据上报
   */
  @ApiOperation({ summary: '批量数据上报', description: '接收 SDK 上报的批量埋点事件' })
  @ApiBody({ type: BatchCollectDto })
  @ApiResponse({ status: 200, description: '数据上报成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Post('batch')
  createBatch(@Body() batchCollectDto: BatchCollectDto) {
    return this.collectService.createBatch(batchCollectDto);
  }

  @Get('/test-ip')
  test(@Req() req: any) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    return this.ipService.getRegion(ip);
  }
}

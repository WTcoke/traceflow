import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TrackService } from './track.service';
import { CreateTrackDto, BatchTrackDto, TrackQueryDto } from './dto';

@ApiTags('track - 埋点事件')
@Controller('track')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TrackController {
  constructor(private readonly trackService: TrackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '单条事件上报', description: '客户端上报单个埋点事件' })
  @ApiResponse({
    status: 201,
    description: '事件创建成功',
    schema: {
      example: {
        success: true,
        data: { id: '1', eventId: '550e8400-e29b-41d4-a716-446655440000' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async track(@Body() dto: CreateTrackDto) {
    const result = await this.trackService.createEvent(dto);
    return {
      success: true,
      data: {
        id: result.id.toString(),
        eventId: result.eventId,
      },
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量事件上报', description: '客户端批量上报多个埋点事件，最多100条' })
  @ApiResponse({
    status: 201,
    description: '批量事件创建成功',
    schema: {
      example: {
        success: true,
        data: { accepted: 98, rejected: 2, errors: [] },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误或批量大小超限' })
  async trackBatch(@Body() dto: BatchTrackDto) {
    const result = await this.trackService.createEventBatch(dto);
    return {
      success: true,
      data: {
        accepted: result.count,
        rejected: dto.events.length - result.count,
        errors: [],
      },
    };
  }

  @Get('analytics/simple-stats')
  @ApiOperation({ summary: '简单统计', description: '获取时间范围内的埋点事件统计' })
  @ApiQuery({ name: 'startTime', description: '开始时间戳(毫秒)', example: 0, required: true })
  @ApiQuery({
    name: 'endTime',
    description: '结束时间戳(毫秒)',
    example: 9999999999999,
    required: true,
  })
  @ApiQuery({ name: 'userId', description: '按用户ID筛选(可选)', required: false })
  @ApiQuery({
    name: 'eventType',
    description: '按事件类型筛选(可选)',
    enum: ['track', 'page', 'error', 'identify', 'custom'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '统计结果',
    schema: {
      example: {
        success: true,
        data: {
          totalEvents: 1234567,
          byEventType: { track: 500000, page: 600000, error: 100000, identify: 34567, custom: 0 },
          byPlatform: { web: 800000, 'miniapp-weixin': 400000, 'miniapp-alipay': 34567 },
          uniqueUsers: 50000,
          uniqueSessions: 120000,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '缺少必要参数' })
  async getSimpleStats(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('userId') userId?: string,
    @Query('eventType') eventType?: string,
  ) {
    if (!startTime || !endTime) {
      return {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startTime and endTime are required',
        },
      };
    }

    const stats = await this.trackService.getSimpleStats(Number(startTime), Number(endTime), {
      userId,
      eventType,
    });
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '查询事件', description: '根据ID查询单条埋点事件详情' })
  @ApiParam({
    name: 'id',
    description: '事件ID(eventId或数据库自增id)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({ name: 'idType', description: 'ID类型', enum: ['eventId', 'dbId'], required: false })
  @ApiResponse({
    status: 200,
    description: '事件详情',
    schema: {
      example: {
        success: true,
        data: {
          id: '1',
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          eventType: 'page',
          eventName: null,
          timestamp: '1713001234567',
          userId: 'user-123',
          anonymousId: 'anon-456',
          sessionId: 'sess-789',
          url: 'https://example.com/page',
          title: '首页',
          referrer: 'https://google.com',
          deviceInfo: { deviceId: 'device-001', platform: 'web' },
          properties: { key: 'value' },
          priority: 'normal',
          createdAt: '1713001235000',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '事件不存在' })
  async getEvent(@Param('id') id: string, @Query() query: TrackQueryDto) {
    const event = await this.trackService.findEvent(id, query.idType);

    if (!event) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found',
        },
      });
    }

    const data = {
      id: event.id.toString(),
      eventId: event.eventId,
      eventType: event.eventType,
      eventName: event.eventName,
      timestamp: event.timestamp.toString(),
      userId: event.userId,
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
      url: event.url,
      title: event.title,
      referrer: event.referrer,
      deviceInfo: event.deviceInfo,
      properties: event.properties,
      priority: event.priority,
      createdAt: event.createdAt.toString(),
    };

    return {
      success: true,
      data,
    };
  }
}

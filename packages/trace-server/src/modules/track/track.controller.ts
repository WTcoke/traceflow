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
import { TrackService } from './track.service';
import { CreateTrackDto, BatchTrackDto, TrackQueryDto } from './dto';

@Controller('track')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TrackController {
  constructor(private readonly trackService: TrackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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

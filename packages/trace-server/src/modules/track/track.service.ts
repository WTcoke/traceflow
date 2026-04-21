import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateTrackDto, BatchTrackDto } from './dto';
import { Prisma } from '@prisma/client';

export interface SimpleStatsResult {
  totalEvents: number;
  byEventType: Record<string, number>;
  byPlatform: Record<string, number>;
  uniqueUsers: number;
  uniqueSessions: number;
}

@Injectable()
export class TrackService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(dto: CreateTrackDto) {
    const existing = await this.prisma.findEventByEventId(dto.eventId);
    if (existing) {
      throw new BadRequestException(`Event with id ${dto.eventId} already exists`);
    }

    const createdAt = BigInt(Date.now());

    return this.prisma.createEvent({
      eventId: dto.eventId,
      eventType: dto.eventType,
      eventName: dto.eventName,
      timestamp: BigInt(dto.timestamp),
      userId: dto.userId,
      anonymousId: dto.anonymousId,
      sessionId: dto.sessionId,
      url: dto.url,
      title: dto.title,
      referrer: dto.referrer,
      deviceInfo: dto.deviceInfo,
      properties: dto.properties,
      priority: dto.priority || 'normal',
      createdAt,
    });
  }

  async createEventBatch(dto: BatchTrackDto) {
    if (dto.events.length > 100) {
      throw new BadRequestException('Batch size exceeds maximum of 100');
    }

    const createdAt = BigInt(Date.now());

    const events = dto.events.map((e) => ({
      eventId: e.eventId,
      eventType: e.eventType,
      eventName: e.eventName,
      timestamp: BigInt(e.timestamp),
      userId: e.userId,
      anonymousId: e.anonymousId,
      sessionId: e.sessionId,
      url: e.url,
      title: e.title,
      referrer: e.referrer,
      deviceInfo: e.deviceInfo,
      properties: e.properties,
      priority: e.priority || 'normal',
      createdAt,
    }));

    return this.prisma.createEventBatch(events);
  }

  async findEvent(id: string, idType: 'eventId' | 'dbId' = 'eventId') {
    if (idType === 'dbId') {
      return this.prisma.findEventById(BigInt(id));
    }
    return this.prisma.findEventByEventId(id);
  }

  async getSimpleStats(
    startTime: number,
    endTime: number,
    filters: { userId?: string; eventType?: string },
  ): Promise<SimpleStatsResult> {
    const where: Prisma.TraceEventWhereInput = {
      timestamp: {
        gte: BigInt(startTime),
        lte: BigInt(endTime),
      },
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.eventType) {
      where.eventType = filters.eventType as any;
    }

    const [totalEvents, events, uniqueUsers, uniqueSessions] = await Promise.all([
      this.prisma.countEvents(where),
      this.prisma.findManyForStats(where),
      this.prisma.groupByUserId(where),
      this.prisma.groupBySessionId(where),
    ]);

    const byEventType: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};

    for (const e of events) {
      const et = e.eventType as string;
      byEventType[et] = (byEventType[et] || 0) + 1;

      const deviceInfo = e.deviceInfo as { platform?: string };
      const platform = deviceInfo?.platform || 'unknown';
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    }

    return {
      totalEvents,
      byEventType,
      byPlatform,
      uniqueUsers: uniqueUsers.length,
      uniqueSessions: uniqueSessions.length,
    };
  }
}

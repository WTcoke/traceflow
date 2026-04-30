import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TraceEventType, TracePriority } from '@prisma/client';
import { CollectBatchDto } from './dto/collect-batch.dto';
import { CollectEventDto } from './dto/collect-event.dto';
import { CollectSingleDto } from './dto/collect-single.dto';

@Injectable()
export class CollectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 单条数据上报
   */
  async collectSingle(_appKey: string, dto: CollectSingleDto) {
    const event = dto.data;
    await this.prisma.createEvent({
      eventId: event.eventId,
      eventType: event.eventType,
      eventName: event.eventName,
      timestamp: BigInt(event.timestamp),
      userId: event.userId,
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
      url: event.url,
      title: event.title,
      referrer: event.referrer,
      deviceInfo: event.deviceInfo,
      properties: event.properties,
      priority: event.priority || 'normal',
      createdAt: BigInt(Date.now()),
    });

    return {
      successCount: 1,
      failCount: 0,
      failData: [],
    };
  }

  /**
   * 批量数据上报
   */
  async collectBatch(_appKey: string, dto: CollectBatchDto) {
    const events = dto.data.map((event) => ({
      eventId: event.eventId,
      eventType: event.eventType as TraceEventType,
      eventName: event.eventName,
      timestamp: BigInt(event.timestamp),
      userId: event.userId,
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
      url: event.url,
      title: event.title,
      referrer: event.referrer,
      deviceInfo: event.deviceInfo,
      properties: event.properties,
      priority: (event.priority || 'normal') as TracePriority,
      createdAt: BigInt(Date.now()),
    }));

    const result = await this.prisma.createEventBatch(events);

    return {
      successCount: result.count,
      failCount: dto.data.length - result.count,
      failData: [],
    };
  }
}

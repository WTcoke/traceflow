import { Injectable } from '@nestjs/common';
import { PrismaClient, TraceEventType, TracePriority } from '@prisma/client';
import { BatchCollectDto, SingleCollectDto } from './dto/create-collect.dto';
import { parseIP } from '../../common/utils';

@Injectable()
export class CollectService {
  private prisma = new PrismaClient();

  track(req: any) {
    let ip =
      req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';

    if (typeof ip === 'string') {
      ip = ip.split(',')[0].trim();
    }

    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    const res = parseIP(ip);
    const region = {
      country: res?.country || '',
      region: res?.province || '',
      city: res?.city || '',
    };

    return {
      ip,
      region,
    };
  }
  /**
   * 单条数据上报
   */
  async createSingle(singleCollectDto: SingleCollectDto) {
    const { projectId, data } = singleCollectDto;

    await this.prisma.traceEvent.create({
      data: {
        eventId: data.eventId,
        eventType: data.eventType as TraceEventType,
        timestamp: data.timestamp,
        userId: data.userId,
        anonymousId: data.anonymousId,
        sessionId: data.sessionId,
        deviceInfo: data.deviceInfo as any,
        properties: data.properties,
        priority: (data.priority || 'normal') as TracePriority,
        createdAt: data._createdAt,
        url: data.properties?.url,
        title: data.properties?.title,
        eventName: data.properties?.event,
      },
    });

    return { success: true, message: 'Data collected successfully' };
  }

  /**
   * 批量数据上报
   */
  async createBatch(batchCollectDto: BatchCollectDto) {
    const { projectId, data } = batchCollectDto;

    const createManyData = data.map((event) => ({
      eventId: event.eventId,
      eventType: event.eventType as TraceEventType,
      timestamp: event.timestamp,
      userId: event.userId,
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
      deviceInfo: event.deviceInfo as any,
      properties: event.properties,
      priority: (event.priority || 'normal') as TracePriority,
      createdAt: event._createdAt,
      url: event.properties?.url,
      title: event.properties?.title,
      eventName: event.properties?.event,
    }));

    await this.prisma.traceEvent.createMany({
      data: createManyData,
    });

    return {
      success: true,
      message: `Batch data collected successfully (${createManyData.length} events)`,
    };
  }
}

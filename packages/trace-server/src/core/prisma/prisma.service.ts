import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async findEventByEventId(eventId: string) {
    return this.traceEvent.findUnique({
      where: { eventId },
    });
  }

  async findEventById(id: bigint) {
    return this.traceEvent.findUnique({
      where: { id },
    });
  }

  async createEvent(data: {
    eventId: string;
    eventType: 'track' | 'page' | 'error' | 'identify' | 'custom';
    eventName?: string;
    timestamp: bigint;
    userId?: string;
    anonymousId: string;
    sessionId: string;
    url?: string;
    title?: string;
    referrer?: string;
    deviceInfo: object;
    properties?: object;
    priority: 'critical' | 'normal' | 'low';
    createdAt: bigint;
  }) {
    return this.traceEvent.create({
      data: {
        eventId: data.eventId,
        eventType: data.eventType,
        eventName: data.eventName,
        timestamp: data.timestamp,
        userId: data.userId,
        anonymousId: data.anonymousId,
        sessionId: data.sessionId,
        url: data.url,
        title: data.title,
        referrer: data.referrer,
        deviceInfo: data.deviceInfo,
        properties: data.properties,
        priority: data.priority,
        sent: true,
        retryCount: 0,
        createdAt: data.createdAt,
      },
    });
  }

  async createEventBatch(
    events: Array<{
      eventId: string;
      eventType: 'track' | 'page' | 'error' | 'identify' | 'custom';
      eventName?: string;
      timestamp: bigint;
      userId?: string;
      anonymousId: string;
      sessionId: string;
      url?: string;
      title?: string;
      referrer?: string;
      deviceInfo: object;
      properties?: object;
      priority: 'critical' | 'normal' | 'low';
      createdAt: bigint;
    }>,
  ) {
    return this.traceEvent.createMany({
      data: events.map((e) => ({
        eventId: e.eventId,
        eventType: e.eventType,
        eventName: e.eventName,
        timestamp: e.timestamp,
        userId: e.userId,
        anonymousId: e.anonymousId,
        sessionId: e.sessionId,
        url: e.url,
        title: e.title,
        referrer: e.referrer,
        deviceInfo: e.deviceInfo,
        properties: e.properties,
        priority: e.priority,
        sent: true,
        retryCount: 0,
        createdAt: e.createdAt,
      })),
      skipDuplicates: true,
    });
  }

  async countEvents(where: any) {
    return this.traceEvent.count({ where });
  }

  async groupByUserId(where: any) {
    return this.traceEvent.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: true,
    });
  }

  async groupBySessionId(where: any) {
    return this.traceEvent.groupBy({
      by: ['sessionId'],
      where,
      _count: true,
    });
  }

  async findManyForStats(where: any) {
    return this.traceEvent.findMany({
      where,
      select: { eventType: true, deviceInfo: true },
    });
  }
}

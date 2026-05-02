import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BehaviorPathsQueryDto } from './dto/behavior-paths-query.dto';
import { BehaviorPathsResponseDto, BehaviorPathItemDto } from './dto/behavior-paths-response.dto';

@Injectable()
export class BehaviorService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaths(query: BehaviorPathsQueryDto): Promise<BehaviorPathsResponseDto> {
    const { projectId, deviceId, userId, startTime, endTime, pageNum = 1, pageSize = 10 } = query;

    const where: any = {
      projectId: BigInt(projectId),
      eventType: 'behavior',
      eventTime: {
        gte: BigInt(startTime),
        lte: BigInt(endTime),
      },
    };

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (userId) {
      where.userId = userId;
    }

    const skip = (pageNum - 1) * pageSize;

    const [total, records] = await Promise.all([
      this.prisma.buriedPointData.count({ where }),
      this.prisma.buriedPointData.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { eventTime: 'desc' },
      }),
    ]);

    const list: BehaviorPathItemDto[] = records.map((record: any) => {
      const data = record.data as any;
      return {
        pageUrl: record.vPageUrl || '/',
        eventName: data?.eventName || 'unknown',
        element: data?.element || '',
        eventTime: Number(record.eventTime),
      };
    });

    const pages = Math.ceil(total / pageSize);

    return {
      total,
      pages,
      list,
    };
  }
}

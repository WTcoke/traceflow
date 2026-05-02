import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorListQueryDto } from './dto/error-list-query.dto';
import { ErrorListResponseDto, ErrorItemDto } from './dto/error-list-response.dto';

@Injectable()
export class ErrorService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(query: ErrorListQueryDto): Promise<ErrorListResponseDto> {
    const { projectId, startTime, endTime, errorType, pageNum = 1, pageSize = 10 } = query;

    const where: any = {
      projectId: BigInt(projectId),
      eventType: 'error',
      eventTime: {
        gte: BigInt(startTime),
        lte: BigInt(endTime),
      },
    };

    if (errorType) {
      where.vErrorType = errorType;
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

    const list: ErrorItemDto[] = records.map((record) => {
      const data = record.data as any;
      return {
        id: String(record.id),
        errorType: record.vErrorType || 'Unknown',
        message: data?.message || 'No message',
        pageUrl: record.vPageUrl || '/',
        deviceId: record.deviceId,
        eventTime: Number(record.eventTime),
        stack: data?.stack || '',
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
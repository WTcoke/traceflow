import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { SingleBuriedPointDto } from './dto/buried-point.dto';

@Injectable()
export class CollectService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.BURIED_POINT)
    private readonly buriedPointQueue: Queue,
  ) {}

  async verifySignature(
    appId: string,
    timestamp: string,
    signature: string,
    body: string,
  ): Promise<{ projectId: bigint }> {
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Invalid or expired timestamp');
    }

    const project = await this.prisma.project.findUnique({
      where: { appId },
    });

    if (!project) {
      throw new UnauthorizedException('Invalid appId');
    }

    if (project.status !== 1) {
      throw new UnauthorizedException('Project is disabled');
    }

    const expectedSignature = this.generateSignature(project.projectKey, timestamp, body);

    if (expectedSignature !== signature) {
      throw new UnauthorizedException('Invalid signature');
    }

    return { projectId: project.id };
  }

  private generateSignature(projectKey: string, timestamp: string, body: string): string {
    const payload = `${timestamp}${body}`;
    return createHmac('sha256', projectKey).update(payload).digest('hex');
  }

  async sendToQueue(projectId: bigint, items: SingleBuriedPointDto[]): Promise<void> {
    await this.buriedPointQueue.add('buried_point', {
      projectId,
      items,
    });
  }
}

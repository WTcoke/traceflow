import { Injectable } from '@nestjs/common';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import * as os from 'node:os';

@Injectable()
export class MonitorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // 获取 CPU 使用率
  private getCpuUsage(): number {
    const cpusInfo = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;

    for (const cpu of cpusInfo) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
    }

    const total = user + nice + sys + idle;
    return total > 0 ? parseFloat((((user + sys + nice) / total) * 100).toFixed(1)) : 0;
  }

  // 获取健康状态
  async getHealth(): Promise<any> {
    // 检查 Redis 连接
    let redisStatus = 'disconnected';
    try {
      const redisOk = await this.redis.ping();
      redisStatus = redisOk ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'disconnected';
    }

    // 检查 DB 连接
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: 'ok',
      uptime: Math.round(process.uptime() * 1000),
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      cpuUsage: `${this.getCpuUsage()}%`,
      redisStatus,
      dbStatus,
    };
  }

  create(createMonitorDto: CreateMonitorDto) {
    return 'This action adds a new monitor';
  }

  findAll() {
    return `This action returns all monitor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} monitor`;
  }

  update(id: number, updateMonitorDto: UpdateMonitorDto) {
    return `This action updates a #${id} monitor`;
  }

  remove(id: number) {
    return `This action removes a #${id} monitor`;
  }
}

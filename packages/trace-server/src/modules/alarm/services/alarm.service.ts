import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateAlarmRuleDto } from '../dto/create-alarm.dto';
import { UpdateAlarmRuleDto } from '../dto/update-alarm.dto';
import { HandleAlarmRecordDto } from '../dto/handle-alarm-record.dto';
import { AlarmRecordQueryDto } from '../dto/alarm-record-query.dto';

@Injectable()
export class AlarmService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建告警规则
  async createAlarmRule(dto: CreateAlarmRuleDto) {
    const rule = await this.prisma.alarmRule.create({
      data: {
        projectId: BigInt(dto.projectId),
        ruleName: dto.ruleName,
        alarmType: dto.alarmType,
        threshold: dto.threshold as any,
        receivers: dto.receivers as any,
        status: dto.status ?? 1,
      },
    });

    return { id: Number(rule.id) };
  }

  // 更新告警规则
  async updateAlarmRule(id: number, dto: UpdateAlarmRuleDto) {
    const existing = await this.prisma.alarmRule.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException('告警规则不存在');
    }
    await this.prisma.alarmRule.update({
      where: { id: BigInt(id) },
      data: {
        ...dto,
        projectId: dto.projectId !== undefined ? BigInt(dto.projectId) : undefined,
      },
    });

    return { message: '更新成功' };
  }

  // 删除告警规则
  async deleteAlarmRule(id: number) {
    const existing = await this.prisma.alarmRule.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException('告警规则不存在');
    }

    await this.prisma.alarmRule.delete({
      where: { id: BigInt(id) },
    });

    return { message: '删除成功' };
  }

  // 告警记录列表
  async findAlarmRecords(query: AlarmRecordQueryDto) {
    const { projectId, status, pageNum = 1, pageSize = 10 } = query;
    console.log('projectId:', typeof projectId);

    const where: any = {
      projectId: Number(projectId),
    };

    if (status !== undefined) {
      where.status = status;
    }

    const total = await this.prisma.alarmRecord.count({ where });

    const list = await this.prisma.alarmRecord.findMany({
      where,
      orderBy: { createTime: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return {
      list: list.map((item) => ({
        id: Number(item.id),
        ruleId: Number(item.ruleId),
        projectId: Number(item.projectId),
        alarmContent: item.alarmContent,
        alarmLevel: item.alarmLevel,
        status: item.status,
        createTime: item.createTime,
      })),
      total,
      pageNum,
      pageSize,
    };
  }

  // 处理告警
  async handleAlarmRecord(id: number, dto: HandleAlarmRecordDto) {
    const existing = await this.prisma.alarmRecord.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException('告警记录不存在');
    }

    await this.prisma.alarmRecord.update({
      where: { id: BigInt(id) },
      data: {
        status: dto.status,
        handleTime: new Date(),
      },
    });

    return { message: '处理成功' };
  }
}

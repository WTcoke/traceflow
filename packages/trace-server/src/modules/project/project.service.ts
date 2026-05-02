import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  // 生成随机 appId
  private generateAppId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'app_';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 生成随机 projectKey
  private generateProjectKey(): string {
    return randomBytes(32).toString('hex');
  }

  // 创建项目
  async create(createProjectDto: CreateProjectDto, creatorId: number) {
    const { projectName, description, config } = createProjectDto;

    // 检查项目名称是否已存在（未删除的）
    const exist = await this.prisma.project.findFirst({
      where: { projectName, status: 1 },
    });
    if (exist) {
      throw new ConflictException('项目名称已存在');
    }

    const appId = this.generateAppId();
    const projectKey = this.generateProjectKey();

    const project = await this.prisma.project.create({
      data: {
        projectName,
        description: description || null,
        appId,
        projectKey,
        config: config || undefined,
        status: 1,
        creatorId: BigInt(creatorId),
      },
      select: {
        id: true,
        projectName: true,
        description: true,
        appId: true,
        config: true,
        status: true,
        creatorId: true,
        createTime: true,
        updateTime: true,
      },
    });

    return {
      id: Number(project.id),
      projectName: project.projectName,
      description: project.description,
      appId: project.appId,
      config: project.config,
      status: project.status,
      creatorId: Number(project.creatorId),
      createTime: project.createTime,
      updateTime: project.updateTime,
    };
  }

  // 获取项目列表（分页 + 搜索）
  async findAll(query: QueryProjectDto) {
    const { pageNum = 1, pageSize = 10, keyword } = query;
    const where: any = { status: 1 };

    if (keyword) {
      where.OR = [{ projectName: { contains: keyword } }, { appId: { contains: keyword } }];
    }

    const total = await this.prisma.project.count({ where });

    const list = await this.prisma.project.findMany({
      where,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
      select: {
        id: true,
        projectName: true,
        description: true,
        appId: true,
        config: true,
        status: true,
        creatorId: true,
        createTime: true,
        updateTime: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return {
      list: list.map((p) => ({
        id: Number(p.id),
        projectName: p.projectName,
        description: p.description,
        appId: p.appId,
        config: p.config,
        status: p.status,
        creatorId: Number(p.creatorId),
        createTime: p.createTime,
        updateTime: p.updateTime,
        creator: p.creator
          ? {
              id: Number(p.creator.id),
              username: p.creator.username,
              name: p.creator.name,
            }
          : null,
      })),
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取项目详情（不返回 projectKey）
  async findOne(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: BigInt(id), status: 1 },
      select: {
        id: true,
        projectName: true,
        description: true,
        appId: true,
        config: true,
        status: true,
        creatorId: true,
        createTime: true,
        updateTime: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或已删除');
    }

    return {
      id: Number(project.id),
      projectName: project.projectName,
      description: project.description,
      appId: project.appId,
      config: project.config,
      status: project.status,
      creatorId: Number(project.creatorId),
      createTime: project.createTime,
      updateTime: project.updateTime,
      creator: project.creator
        ? {
            id: Number(project.creator.id),
            username: project.creator.username,
            name: project.creator.name,
          }
        : null,
    };
  }

  // 更新项目配置
  async update(id: number, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: BigInt(id), status: 1 },
    });
    if (!project) {
      throw new NotFoundException('项目不存在或已删除');
    }

    const data: any = {};
    if (updateProjectDto.projectName !== undefined) data.projectName = updateProjectDto.projectName;
    if (updateProjectDto.description !== undefined) data.description = updateProjectDto.description;
    if (updateProjectDto.config !== undefined) data.config = updateProjectDto.config;
    if (updateProjectDto.status !== undefined) data.status = updateProjectDto.status;

    await this.prisma.project.update({
      where: { id: BigInt(id) },
      data,
    });

    return { message: '更新成功' };
  }

  // 删除项目（软删除）
  async remove(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: BigInt(id), status: 1 },
    });
    if (!project) {
      throw new NotFoundException('项目不存在或已删除');
    }

    await this.prisma.project.update({
      where: { id: BigInt(id) },
      data: { status: 0 },
    });

    return { message: '删除成功' };
  }
}
